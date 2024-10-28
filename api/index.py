from flask import Flask, request, jsonify
from colorama import init
import numpy as np
from collections import defaultdict, deque
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


class AdvancedGamePredictor:
    def __init__(self):
        init()
        self.sequence = ""
        self.current_sequence = self.sequence
        self.pattern_memory = defaultdict(lambda: {'A': 0, 'B': 0})
        self.max_pattern_length = 7
        self.min_pattern_length = 2
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
        for i in range(len(self.sequence) - self.max_pattern_length):
            pattern = self.sequence[i:i + self.max_pattern_length]
            pattern_features = [1 if c == 'A' else 0 for c in pattern]
            X.append(pattern_features)
            y.append(1 if self.sequence[i + self.max_pattern_length] == 'A' else 0)

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

        # 1. ML Model Prediction
        ml_pred, ml_conf = self.get_ml_prediction(last_chars[-self.max_pattern_length:])
        predictions.append((ml_pred, ml_conf, 3))

        # 2. Markov Chain Prediction
        markov_pred, markov_conf = self.get_markov_prediction(last_chars[-1])
        if markov_pred:
            predictions.append((markov_pred, markov_conf, 2))

        # 3. Pattern Database Prediction
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
                    predictions.append((pred, conf, 2))

        # Calculate weighted prediction
        weighted_a = 0
        weighted_b = 0
        total_weight = 0

        for pred, conf, weight in predictions:
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
        self.current_sequence += user_input
        last_chars = self.current_sequence[-self.max_pattern_length:]
        prediction, confidence = self.analyze_patterns(last_chars)

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
            output_message['message'] = f"Next Character = '{prediction}'"
            output_message['color'] = 'green' if prediction == 'A' else 'blue'
        else:
            output_message['message'] = "Wait for next character"
            output_message['color'] = 'yellow'

        # Store current prediction for next validation
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
    result = predictor.predict_next(last_char)
    return jsonify(result)


if __name__ == "__main__":
    predictor = AdvancedGamePredictor()
    app.run(debug=True, port=5959)
