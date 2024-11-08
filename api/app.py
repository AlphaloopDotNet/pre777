from flask import Flask, request, jsonify
from colorama import init
import numpy as np
from collections import defaultdict, deque
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from flask_cors import CORS
from scipy.fft import fft
from scipy import stats
import PyPDF2
import io
import re
from sklearn.model_selection import cross_val_score

app = Flask(__name__)
CORS(app)

class AdvancedGamePredictor:
    def __init__(self):
        init()
        self.sequence = ""
        self.current_sequence = self.sequence
        self.pattern_memory = defaultdict(lambda: {'A': 0, 'B': 0})
        self.max_pattern_length = 13
        self.min_pattern_length = 5
        self.prediction_history = []
        self.accuracy_history = []
        self.window_size = 20
        self.recent_predictions = deque(maxlen=self.window_size)
        # Initialize ML components
        self.scaler = StandardScaler()
        self.mlp = MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=1000)
        self.markov_chain = {'A': {'A': 0, 'B': 0}, 'B': {'A': 0, 'B': 0}}

        # Initialize performance metrics
        self.correct_predictions = 0
        self.total_predictions = 0
        self.last_prediction = None
        self.previous_was_correct = False

    def initialize_ml_model(self, sequence):
        if not sequence or not all(c in 'AB' for c in sequence):
            raise ValueError("Sequence must only contain characters 'A' or 'B'.")

        self.sequence = sequence
        self.current_sequence = self.sequence
        self.markov_chain = self._build_markov_chain()
        self.build_pattern_database()
        self.initialize_mlp()

    def _build_markov_chain(self):
        markov = {'A': {'A': 0, 'B': 0}, 'B': {'A': 0, 'B': 0}}
        for i in range(len(self.sequence) - 1):
            current, next_char = self.sequence[i], self.sequence[i + 1]
            markov[current][next_char] += 1
        return markov

    def initialize_mlp(self):
        X = []
        y = []
        augmented_sequence = self.augment_training_data()

        for i in range(len(augmented_sequence) - self.max_pattern_length):
            pattern = augmented_sequence[i:i + self.max_pattern_length]
            pattern_features = [1 if c == 'A' else 0 for c in pattern]
            X.append(pattern_features)
            y.append(1 if augmented_sequence[i + self.max_pattern_length] == 'A' else 0)

        X = np.array(X)
        y = np.array(y)
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.mlp.fit(X_scaled, y)

    def build_pattern_database(self):
        self.pattern_memory = defaultdict(lambda: {'A': 0, 'B': 0})
        self.pattern_transitions = defaultdict(lambda: {'A': 0, 'B': 0})

        for length in range(self.min_pattern_length, self.max_pattern_length + 1):
            for i in range(len(self.sequence) - length):
                pattern = self.sequence[i:i + length]
                if i + length < len(self.sequence):
                    next_char = self.sequence[i + length]
                    self.pattern_memory[pattern][next_char] += 1
                    self.pattern_transitions[pattern][next_char] += 1

    def analyze_pattern_complexity(self, pattern):
        # Temporal analysis
        pattern_freq = {}
        for i in range(len(pattern) - 1):
            sub_pattern = pattern[i:i + 2]
            pattern_freq[sub_pattern] = pattern_freq.get(sub_pattern, 0) + 1

        # Calculate entropy as complexity measure
        total = sum(pattern_freq.values())
        probabilities = [count / total for count in pattern_freq.values()]
        entropy = stats.entropy(probabilities) if probabilities else 0

        # Add positional encoding
        position_weights = np.linspace(0.5, 1.0, len(pattern))
        weighted_pattern = sum([w * (1 if c == 'A' else 0) for w, c in zip(position_weights, pattern)])

        return entropy, weighted_pattern

    def calibrate_prediction_weights(self):
        if len(self.prediction_history) < 10:
            return {'ml': 3, 'markov': 2, 'pattern': 2, 'cycle': 1}

        weights = {}
        for method in ['ml', 'markov', 'pattern', 'cycle']:
            correct = self.method_performance[method]['correct']
            total = self.method_performance[method]['total']
            accuracy = correct / total if total > 0 else 0
            weights[method] = accuracy * 5  # Scale factor

        # Normalize weights
        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v / total_weight * 8 for k, v in weights.items()}

        return weights

    def enhanced_cycle_detection(self, sequence):
        if len(sequence) < 4:
            return None

        # FFT analysis
        sequence_numeric = np.array([1 if c == 'A' else 0 for c in sequence])
        fft_result = fft(sequence_numeric)
        frequencies = np.abs(fft_result)

        # Autocorrelation
        autocorr = np.correlate(sequence_numeric, sequence_numeric, mode='full')
        autocorr = autocorr[len(autocorr) // 2:]

        # Find peaks in autocorrelation
        peaks = []
        for i in range(1, len(autocorr) - 1):
            if autocorr[i] > autocorr[i - 1] and autocorr[i] > autocorr[i + 1]:
                peaks.append((i, autocorr[i]))

        if peaks:
            strongest_period = max(peaks, key=lambda x: x[1])[0]
            if strongest_period > 0:
                predicted_value = sequence[-(strongest_period):]
                return predicted_value[0]

        return None

    def tune_hyperparameters(self):
        X = []
        y = []
        for i in range(len(self.current_sequence) - self.max_pattern_length):
            pattern = self.current_sequence[i:i + self.max_pattern_length]
            pattern_features = [1 if c == 'A' else 0 for c in pattern]
            X.append(pattern_features)
            y.append(1 if self.current_sequence[i + self.max_pattern_length] == 'A' else 0)

        X = np.array(X)
        y = np.array(y)

        # Compare different architectures
        architectures = [
            (50,), (100,), (50, 25), (100, 50),
            (100, 50, 25), (200, 100, 50)
        ]

        best_score = 0
        best_architecture = None

        for arch in architectures:
            mlp = MLPClassifier(hidden_layer_sizes=arch, max_iter=10000)
            score = np.mean(cross_val_score(mlp, X, y, cv=3))
            if score > best_score:
                best_score = score
                best_architecture = arch

        return best_score, best_architecture

    def augment_training_data(self):
        augmented_sequence = self.sequence

        # Add shifted sequences
        for shift in range(1, 4):
            shifted = self.sequence[shift:] + self.sequence[:shift]
            augmented_sequence += shifted

        # Add mirrored sequences
        mirrored = ''.join(['A' if c == 'B' else 'B' for c in self.sequence])
        augmented_sequence += mirrored

        # Add reversed sequences
        reversed_seq = self.sequence[::-1]
        augmented_sequence += reversed_seq

        # Add pattern-based augmentations
        for i in range(len(self.sequence) - 5):
            pattern = self.sequence[i:i + 5]
            if pattern.count('A') > 3:
                augmented_sequence += 'A' + pattern
            if pattern.count('B') > 3:
                augmented_sequence += 'B' + pattern

        return augmented_sequence

    def update_ml_model(self, last_char):
        if len(self.current_sequence) >= self.max_pattern_length + 1:
            pattern = self.current_sequence[-(self.max_pattern_length + 1):-1]
            pattern_features = [1 if c == 'A' else 0 for c in pattern]
            X = np.array([pattern_features])
            y = np.array([1 if last_char == 'A' else 0])

            self.scaler.partial_fit(X)
            X_scaled = self.scaler.transform(X)
            self.mlp.partial_fit(X_scaled, y, classes=np.array([0, 1]))

    def get_markov_prediction(self, last_char):
        transitions = self.markov_chain[last_char]
        total = sum(transitions.values())
        if total == 0:
            return None, 0
        a_prob = (transitions['A'] / total) * 100
        b_prob = (transitions['B'] / total) * 100
        return ('A', a_prob) if a_prob > b_prob else ('B', b_prob)

    def get_ml_prediction(self, pattern):
        pattern_features = [1 if c == 'A' else 0 for c in pattern]
        X = np.array([pattern_features])
        X_scaled = self.scaler.transform(X)
        prob = self.mlp.predict_proba(X_scaled)[0]
        return ('A', prob[1] * 100) if prob[1] > prob[0] else ('B', prob[0] * 100)

    def analyze_patterns(self, last_chars):
        predictions = []

        # Get pattern complexity
        complexity, weighted_pattern = self.analyze_pattern_complexity(last_chars)

        # ML Model Prediction
        ml_pred, ml_conf = self.get_ml_prediction(last_chars[-self.max_pattern_length:])
        predictions.append((ml_pred, ml_conf * (1 + complexity / 10), 'ml'))

        # Markov Chain Prediction
        markov_pred, markov_conf = self.get_markov_prediction(last_chars[-1])
        if markov_pred:
            predictions.append((markov_pred, markov_conf, 'markov'))

        # Pattern Database Prediction with complexity weighting
        for length in range(self.max_pattern_length, self.min_pattern_length - 1, -1):
            if len(last_chars) >= length:
                pattern = last_chars[-length:]
                pattern_stats = self.pattern_transitions[pattern]
                total = sum(pattern_stats.values())
                if total > 0:
                    a_prob = (pattern_stats['A'] / total) * 100
                    b_prob = (pattern_stats['B'] / total) * 100
                    pred = 'A' if a_prob > b_prob else 'B'
                    conf = max(a_prob, b_prob)
                    predictions.append((pred, conf * (1 + complexity / 10), 'pattern'))

        # Enhanced Cycle Detection
        cycle_pred = self.enhanced_cycle_detection(last_chars)
        if cycle_pred:
            predictions.append((cycle_pred, 85, 'cycle'))

        # Get dynamic weights
        weights = self.calibrate_prediction_weights()

        # Calculate weighted prediction
        weighted_a = 0
        weighted_b = 0
        total_weight = 0

        for pred, conf, method in predictions:
            weight = weights.get(method, 1.0)
            if pred == 'A':
                weighted_a += conf * weight
            else:
                weighted_b += conf * weight
            total_weight += weight

        if total_weight == 0:
            return 'A', 50.0

        if weighted_a > weighted_b:
            return 'A', (weighted_a / total_weight)
        return 'B', (weighted_b / total_weight)

    def predict_next(self, user_input):
        # Append the new character to the current sequence
        self.current_sequence += user_input

        # Update the Markov chain transitions based on the new character
        if len(self.current_sequence) > 1:
            prev_char = self.current_sequence[-2]
            self.markov_chain[prev_char][user_input] += 1

        # Update pattern memory and transitions based on the current sequence
        for length in range(self.min_pattern_length, self.max_pattern_length + 1):
            if len(self.current_sequence) >= length + 1:
                # Extract the pattern ending just before the new character
                pattern = self.current_sequence[-(length + 1):-1]
                self.pattern_transitions[pattern][user_input] += 1
                self.pattern_memory[pattern][user_input] += 1

        # Update the ML model with the new character
        self.update_ml_model(user_input)

        # Get the last few characters (up to max pattern length) for analysis
        last_chars = self.current_sequence[-self.max_pattern_length:]
        prediction, confidence = self.analyze_patterns(last_chars)

        # Increment the total prediction counter and store the recent prediction
        self.total_predictions += 1
        self.recent_predictions.append((prediction, confidence))

        # Validate previous prediction if exists
        if self.last_prediction is not None:
            if user_input == self.last_prediction:
                self.correct_predictions += 1
                self.previous_was_correct = True
            else:
                self.previous_was_correct = False

        # Prepare output message based on previous prediction accuracy and current prediction
        output_message = {'message': '', 'confidence': confidence}

        if self.previous_was_correct and user_input == prediction:
            # If the previous prediction was correct and matches the new input, print it
            output_message['message'] = f"Next Character = '{prediction}'"
            output_message['color'] = 'green' if prediction == 'A' else 'blue'
        elif not self.previous_was_correct:
            # If the previous prediction was incorrect, show red message to wait for next character
            output_message['message'] = "Last Prediction was wrong, wait and add new character"
            output_message['color'] = 'red'
        else:
            # If the prediction is not correct, inform the user to wait for the next character
            output_message['message'] = "Wait for next character"
            output_message['color'] = 'yellow'

        # Store current prediction for the next validation
        self.last_prediction = prediction
        return output_message


@app.route('/')
def index():
    return jsonify({'message': 'Welcome to the Advanced Game Predictor API!'})

@app.route('/api/train', methods=['POST'])
def train():
    data = request.get_json()
    sequence = data.get('sequence', '')
    try:
        predictor.initialize_ml_model(sequence)
        return jsonify({'message': 'Model trained successfully with the provided sequence.'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    last_char = data.get('last_char', '').upper()
    if last_char not in ('A', 'B'):
        return jsonify({'error': 'Last character must be either "A" or "B".'}), 400
    prediction_output = predictor.predict_next(last_char)
    return jsonify(prediction_output)

def extract_a_and_b(text):
    return ''.join(re.findall(r'[AB]', text))

@app.route('/extract_text', methods=['POST'])
def extract_text_from_pdf():

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    try:
        # Read and parse the uploaded PDF
        pdf_file = io.BytesIO(file.read())
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()

        # Extract 'A' and 'B' characters and reverse the result
        result_text = extract_a_and_b(text)
        reversed_text = result_text[::-1]  # Reverse the extracted text

        return jsonify({'text': reversed_text}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    predictor = AdvancedGamePredictor()
    app.run(debug=True, port=5959)