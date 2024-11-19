from flask import Flask, request, jsonify
from EnhancedGamePredictor import EnhancedGamePredictor  # Import the EnhancedGamePredictor class
import logging
import PyPDF2
import io
import re
from flask_cors import CORS
app = Flask(__name__)
CORS(app)


predictor = None

# Set up logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/api/train', methods=['POST'])
def train_model():
    global predictor

    # Get the sequence from the request body
    data = request.get_json()
    sequence = data.get('sequence')

    if not sequence:
        return jsonify({"error": "Sequence is required"}), 400

    try:
        # Initialize the predictor with the provided sequence
        predictor = EnhancedGamePredictor(sequence)
        logging.info("Model trained successfully.")
        return jsonify({"message": "Model trained successfully"}), 200

    except Exception as e:
        logging.error(f"Error training model: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def predict():
    global predictor

    if predictor is None:
        logging.error("Model has not been trained. Call /api/train first.")
        return jsonify({"error": "Model has not been trained. Call /api/train first."}), 400

    # Get the last character from the request
    data = request.get_json()
    last_char = data.get('last_char')

    if last_char not in ['A', 'B']:
        logging.error(f"Invalid input. Last character must be 'A' or 'B'. Received: {last_char}")
        return jsonify({"error": "Invalid input. Please provide 'A' or 'B'."}), 400

    try:
        # Call the predict_next method of your predictor
        prediction = predictor.predict_next(last_char.upper())  # Use the uppercase 'A' or 'B'
        predicted_char, confidence, method = prediction  # Unpack the result

        # Confidence threshold logic to determine the response message and color
        confidence_pct = confidence * 100
        if confidence_pct >= 80 and predicted_char == last_char:
            if predicted_char == 'A':
                message = "Next Character = 'A'"
                color = "green"
            else:
                message = "Next Character = 'B'"
                color = "blue"
        else:
            message = "Wait for next character."
            color = "red"

        # Return the prediction response with color and message
        return jsonify({
            "message": message,
            "color": color
        }), 200

    except Exception as e:
        logging.error(f"Error during prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500


# Helper function to extract only 'A' and 'B' characters from text
def extract_a_and_b(text):
    return ''.join(re.findall(r'[AB]', text))


# Route to extract text from PDF file
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


if __name__ == "__main__":
    app.run(debug=True, port=5959)
