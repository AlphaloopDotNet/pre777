import numpy as np
from collections import defaultdict, deque
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from scipy.fft import fft
from colorama import Fore, Style
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import threading


class EnhancedGamePredictor:
    def __init__(self, sequence):
        # Initialize with a custom sequence passed from the main code
        self.sequence = sequence
        self.current_sequence = self.sequence
        self.current_sequence = self.sequence
        self.pattern_memory = defaultdict(lambda: {'A': 0, 'B': 0})
        self.max_pattern_length = 13
        self.min_pattern_length = 5
        self.prediction_history = []
        self.accuracy_history = []
        self.window_size = 20
        self.recent_predictions = deque(maxlen=self.window_size)
        self.pattern_success_rate = {}

        self.scaler = StandardScaler()
        self.rf_classifier = RandomForestClassifier(n_estimators=100)
        self.gb_classifier = GradientBoostingClassifier()
        self.ensemble_weights = {'rf': 0.5, 'gb': 0.5}

        # Pattern cache
        self.pattern_cache = {}
        self.prediction_cache = {}

        # Time patterns
        self.time_patterns = defaultdict(lambda: {'A': 0, 'B': 0})

        # Performance tracking
        self.method_performance = {
            'ensemble': {'correct': 0, 'total': 0},
            'markov': {'correct': 0, 'total': 0},
            'pattern': {'correct': 0, 'total': 0},
            'cycle': {'correct': 0, 'total': 0},
            'bayesian': {'correct': 0, 'total': 0}
        }

        # Verification components
        self.prediction_state = 'PREDICTING'
        self.consecutive_errors = 0
        self.error_threshold = 3
        self.confidence_threshold = 0.75
        self.reanalysis_lock = threading.Lock()
        self.background_analysis_active = False
        self.last_prediction = None
        self.last_confidence = 0
        self.last_user_input = None

        # Initialize components
        self.initialize_components()

    def initialize_components(self):
        self.build_pattern_database()
        self.initialize_ensemble_models()
        self.initialize_bayesian_priors()
        self.executor = ThreadPoolExecutor(max_workers=4)

    def build_pattern_database(self):
        self.pattern_database = defaultdict(lambda: {'A': 0, 'B': 0})
        self.ngram_patterns = defaultdict(lambda: {'A': 0, 'B': 0})

        for length in range(self.min_pattern_length, self.max_pattern_length + 1):
            for i in range(len(self.sequence) - length):
                pattern = self.sequence[i:i + length]
                next_char = self.sequence[i + length]

                self.pattern_database[pattern][next_char] += 1
                self.pattern_cache[pattern] = {
                    'frequency': self.pattern_database[pattern],
                    'timestamp': time.time()
                }

                for n in range(2, min(length, 5)):
                    ngram = pattern[-n:]
                    self.ngram_patterns[ngram][next_char] += 1

        current_hour = datetime.now().hour
        self.time_patterns[current_hour] = {
            'A': self.sequence.count('A'),
            'B': self.sequence.count('B')
        }

    def initialize_ensemble_models(self):
        X, y = self.prepare_training_data()
        X_scaled = self.scaler.fit_transform(X)
        self.rf_classifier.fit(X_scaled, y)
        self.gb_classifier.fit(X_scaled, y)

    def initialize_bayesian_priors(self):
        self.bayesian_priors = {
            'A': len([c for c in self.sequence if c == 'A']) / len(self.sequence),
            'B': len([c for c in self.sequence if c == 'B']) / len(self.sequence)
        }
        self.transition_probs = self.calculate_transition_probabilities()

    def calculate_transition_probabilities(self):
        transitions = {'A': {'A': 0, 'B': 0}, 'B': {'A': 0, 'B': 0}}
        for i in range(len(self.sequence) - 1):
            curr, next_char = self.sequence[i], self.sequence[i + 1]
            transitions[curr][next_char] += 1
        return transitions

    def attempt_resume_prediction(self):
        if self.prediction_state == 'WAITING':
            latest_confidence = self.calculate_current_confidence()
            if latest_confidence > self.confidence_threshold:
                self.prediction_state = 'PREDICTING'

    def calculate_current_confidence(self):
        recent_predictions = self.prediction_history[-20:]
        if not recent_predictions:
            return 0.5

        correct_count = sum(1 for pred in recent_predictions if pred.get('correct', False))
        confidence = correct_count / len(recent_predictions)
        return confidence

    def prepare_training_data(self):
        X = []
        y = []
        augmented_data = self.augment_training_data()

        for i in range(len(augmented_data) - self.max_pattern_length):
            features = self.extract_features(augmented_data[i:i + self.max_pattern_length])
            X.append(features)
            y.append(1 if augmented_data[i + self.max_pattern_length] == 'A' else 0)

        return np.array(X), np.array(y)

    def augment_training_data(self):
        augmented = self.sequence
        augmented += self.sequence[::-1]  # Add reversed sequence
        augmented += ''.join('A' if c == 'B' else 'B' for c in self.sequence)  # Add inverted sequence
        return augmented

    def extract_features(self, pattern):
        features = []
        features.extend([1 if c == 'A' else 0 for c in pattern])
        features.append(pattern.count('A') / len(pattern))
        features.append(self.calculate_entropy(pattern))

        current_hour = datetime.now().hour
        features.append(np.sin(2 * np.pi * current_hour / 24))
        features.append(np.cos(2 * np.pi * current_hour / 24))

        complexity = self.analyze_pattern_complexity(pattern)
        features.append(complexity)

        return features

    def calculate_entropy(self, pattern):
        freq_a = pattern.count('A') / len(pattern)
        freq_b = 1 - freq_a
        if freq_a == 0 or freq_b == 0:
            return 0
        return -(freq_a * np.log2(freq_a) + freq_b * np.log2(freq_b))

    def analyze_pattern_complexity(self, pattern):
        entropy = self.calculate_entropy(pattern)
        repetition_score = len(set(pattern)) / len(pattern)
        transition_count = sum(1 for i in range(len(pattern) - 1) if pattern[i] != pattern[i + 1])
        transition_score = transition_count / (len(pattern) - 1) if len(pattern) > 1 else 0
        return np.mean([entropy, repetition_score, transition_score])

    def combine_predictions(self, predictions, weights):
        weighted_votes = defaultdict(float)
        for method, (pred, conf) in predictions.items():
            weighted_votes[pred] += conf * weights.get(method, 1.0)

        final_pred = max(weighted_votes.items(), key=lambda x: x[1])
        best_method = max(predictions.items(), key=lambda x: x[1][1])[0]

        return (final_pred[0], final_pred[1], best_method)

    def get_ensemble_prediction(self):
        features = self.extract_features(self.current_sequence[-self.max_pattern_length:])
        X = self.scaler.transform([features])

        rf_prob = self.rf_classifier.predict_proba(X)[0]
        gb_prob = self.gb_classifier.predict_proba(X)[0]

        ensemble_prob = (rf_prob * self.ensemble_weights['rf'] +
                         gb_prob * self.ensemble_weights['gb'])

        return 'A' if ensemble_prob[1] > 0.5 else 'B', max(ensemble_prob)

    def get_markov_prediction(self):
        if not self.current_sequence:
            return 'A', 0.5

        last_char = self.current_sequence[-1]
        transitions = self.transition_probs[last_char]
        total = sum(transitions.values())

        if total == 0:
            return 'A', 0.5

        prob_a = transitions['A'] / total
        return 'A' if prob_a > 0.5 else 'B', max(prob_a, 1 - prob_a)

    def get_pattern_prediction(self):
        if len(self.current_sequence) < self.min_pattern_length:
            return 'A', 0.5

        recent_pattern = self.current_sequence[-self.max_pattern_length:]
        pattern_probs = self.pattern_database[recent_pattern]
        total = sum(pattern_probs.values())

        if total == 0:
            return 'A', 0.5

        prob_a = pattern_probs['A'] / total
        return 'A' if prob_a > 0.5 else 'B', max(prob_a, 1 - prob_a)

    def get_bayesian_prediction(self):
        if not self.current_sequence:
            return 'A', self.bayesian_priors['A']

        last_char = self.current_sequence[-1]
        transitions = self.transition_probs[last_char]
        total = sum(transitions.values())

        if total == 0:
            return 'A', self.bayesian_priors['A']

        prob_a = (transitions['A'] / total) * self.bayesian_priors['A']
        prob_b = (transitions['B'] / total) * self.bayesian_priors['B']

        normalized_prob_a = prob_a / (prob_a + prob_b)
        return 'A' if normalized_prob_a > 0.5 else 'B', max(normalized_prob_a, 1 - normalized_prob_a)

    def get_cycle_prediction(self):
        if len(self.current_sequence) < 10:
            return 'A', 0.5

        numeric_sequence = np.array([1 if c == 'A' else 0 for c in self.current_sequence])
        fft_result = np.abs(fft(numeric_sequence))
        dominant_freq = np.argmax(fft_result[1:len(fft_result) // 2]) + 1

        if dominant_freq == 0:
            return 'A', 0.5

        cycle_length = len(numeric_sequence) // dominant_freq
        if cycle_length == 0:
            return 'A', 0.5

        predicted_value = numeric_sequence[-cycle_length]
        return 'A' if predicted_value > 0.5 else 'B', abs(predicted_value - 0.5) * 2

    def verify_prediction(self, prediction, actual):
        is_correct = prediction[0] == actual
        self.update_verification_metrics(prediction, actual, is_correct)

        if is_correct:
            self.consecutive_errors = 0
            if self.prediction_state == 'WAITING':
                self.attempt_resume_prediction()
        else:
            self.consecutive_errors += 1
            if self.consecutive_errors >= self.error_threshold:
                self.enter_wait_state()

    def update_verification_metrics(self, prediction, actual, is_correct):
        method = prediction[2]
        self.method_performance[method]['total'] += 1
        if is_correct:
            self.method_performance[method]['correct'] += 1

        pattern = self.current_sequence[-self.min_pattern_length:]
        if pattern not in self.pattern_success_rate:
            self.pattern_success_rate[pattern] = {'correct': 0, 'total': 0}
        self.pattern_success_rate[pattern]['total'] += 1
        if is_correct:
            self.pattern_success_rate[pattern]['correct'] += 1

    def enter_wait_state(self):
        self.prediction_state = 'WAITING'

        if not self.background_analysis_active:
            self.background_analysis_active = True
            self.executor.submit(self.perform_reanalysis)

    def perform_reanalysis(self):
        with self.reanalysis_lock:
            try:
                recent_sequence = self.current_sequence[-20:]
                self.analyze_error_patterns(recent_sequence)
                self.adjust_method_weights()
                self.identify_new_patterns(recent_sequence)

                self.consecutive_errors = 0
                self.prediction_state = 'PREDICTING'

            finally:
                self.background_analysis_active = False

    def predict_next(self, last_char):
        self.current_sequence += last_char
        self.last_user_input = last_char

        if self.last_prediction is not None:
            self.verify_prediction(self.last_prediction, last_char)

        predictions = {
            'ensemble': self.get_ensemble_prediction(),
            'markov': self.get_markov_prediction(),
            'pattern': self.get_pattern_prediction(),
            'bayesian': self.get_bayesian_prediction(),
            'cycle': self.get_cycle_prediction()
        }

        weights = self.calculate_dynamic_weights()
        final_prediction = self.combine_predictions(predictions, weights)

        self.last_prediction = final_prediction
        self.prediction_history.append({
            'prediction': final_prediction[0],
            'confidence': final_prediction[1],
            'method': final_prediction[2],
            'timestamp': time.time()
        })

        if self.prediction_state == 'WAITING' and not self.background_analysis_active:
            self.background_analysis_active = True
            self.executor.submit(self.perform_reanalysis)

        return final_prediction

    def display_prediction(self, prediction):
        char, confidence, method = prediction
        confidence_pct = confidence * 100

        # Only display prediction if confidence is 100% and matches last input
        if confidence_pct >= 80 and char == self.last_user_input:
            if char == 'A':
                print(f"{Fore.GREEN}Next Character = \"A\" {Style.RESET_ALL}")
            elif char == 'B':
                print(f"{Fore.BLUE}Next Character = \"B\" {Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}Wait for Next Character to add{Style.RESET_ALL}")

    def analyze_error_patterns(self, sequence):
        errors = []
        for i in range(len(sequence) - 1):
            pattern = sequence[i:i + self.min_pattern_length]
            if pattern in self.pattern_success_rate:
                stats = self.pattern_success_rate[pattern]
                if stats['total'] > 0:
                    error_rate = 1 - (stats['correct'] / stats['total'])
                    errors.append((pattern, error_rate))
        return sorted(errors, key=lambda x: x[1], reverse=True)

    def adjust_method_weights(self):
        total_correct = sum(stats['correct'] for stats in self.method_performance.values())
        if total_correct > 0:
            for method in self.ensemble_weights:
                if self.method_performance[method]['total'] > 0:
                    accuracy = (self.method_performance[method]['correct'] /
                                self.method_performance[method]['total'])
                    self.ensemble_weights[method] = accuracy

    def identify_new_patterns(self, sequence):
        for length in range(self.min_pattern_length, self.max_pattern_length + 1):
            for i in range(len(sequence) - length):
                pattern = sequence[i:i + length]
                if pattern not in self.pattern_database:
                    self.pattern_database[pattern] = {'A': 0, 'B': 0}

    def calculate_dynamic_weights(self):
        weights = {}
        recent_window = min(50, len(self.prediction_history))

        for method in self.method_performance:
            correct = self.method_performance[method]['correct']
            total = self.method_performance[method]['total']

            recent_correct = sum(1 for i in range(-recent_window, 0)
                                 if i < len(self.prediction_history) and
                                 self.prediction_history[i]['method'] == method and
                                 self.prediction_history[i].get('correct', False))

            recent_total = sum(1 for i in range(-recent_window, 0)
                               if i < len(self.prediction_history) and
                               self.prediction_history[i]['method'] == method)

            overall_accuracy = correct / total if total > 0 else 0
            recent_accuracy = recent_correct / recent_total if recent_total > 0 else 0

            weights[method] = 0.4 * overall_accuracy + 0.6 * recent_accuracy

        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v / total_weight for k, v in weights.items()}
        return weights

    def run(self):
        print(f"{Fore.CYAN}Enhanced Game Predictor Started{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Enter 'A' or 'B' for each round, 'Q' to quit{Style.RESET_ALL}")

        while True:
            try:
                user_input = input("\nEnter the most recent winning character (A/B/Q): ").upper()

                if user_input == 'Q':
                    print(f"{Fore.CYAN}Final Statistics:{Style.RESET_ALL}")
                    for method, stats in self.method_performance.items():
                        if stats['total'] > 0:
                            accuracy = stats['correct'] / stats['total'] * 100
                            print(f"{method}: {accuracy:.2f}% accuracy")
                    break

                if user_input in ['A', 'B']:
                    prediction = self.predict_next(user_input)
                    self.display_prediction(prediction)
                else:
                    print(f"{Fore.RED}Invalid input. Please enter 'A', 'B', or 'Q'{Style.RESET_ALL}")

            except Exception as e:
                print(f"{Fore.RED}An error occurred: {str(e)}{Style.RESET_ALL}")
                continue


# if __name__ == "__main__":
#     # The sequence can be passed from the main code
#     initial_sequence = "ABAABABAAABAABAABBBABBBBBBABAAABABBBBAABBABBAABABBBAABBBABBAAABABAABABBAAAABBABAABAAABBBABAAAABABBBBABABBBBAABABAABAAAAAABBAAABBBBBBBBBBBBAAAABABBBBABAAAAAAABBAAABBBBBAAAAABABAABBBBAABBBABBBBAABAABAABAAAABABBAAABBBBBBBAAAAABAAAAAAAABBABAABBABBABBBBABBAABAABABABBBBBBBAAABBBABAAAAAABBABABBAABBBAABBABABAABBAAAABBAABABABABBBBAAABBBBAAAAAAAABBAAABABBAABAABBAABAAABABAABBAAABBABBAAABBBBBAABBBBABBAABBBAAAABAABAAABBABAAAAAAAABBABABBABBBABABAAABBABABBABABBBBABBBBABBAAAAABAABABABBBAABBABAABBAAAAAAAAABABAABBBBBAABBAABBAABABBBAAAABABBAABAAAAAAABBBBABABBABBBABBBABABABAAABBAABBBABBAAAAABBABBABBBABAAABBAABBBBBAABBBAAAABBABBAAABABAAABAABBAAABABABAAABBBABBABBBAABBAABBBBABABABAABBBABBAAAABAABAABAAABABBBBAABABAAAABBBBBBABABBABBBBBBBBBAABBBAAABBABBBAABAABAABBBBAABBABAABAAABABBBAABBAABAAABAABABBBBBABABBBBAABABAABAABAABBBBABAAABBBAAABAABBAAAABBABBBABABBAABBBAAABABABBBBAAAAABAAAABABABBABABBABAAABBAAAABABBAABABAAAAABBBABBABABABAAABABABAAABAABABABBBBAAABBABBBBBBAAAAABBABAAAAB"
#     predictor = EnhancedGamePredictor(initial_sequence)
#     predictor.run()
