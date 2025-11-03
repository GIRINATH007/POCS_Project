# ⚡ Line Coding Simulator - Interactive Web Application

A stunning, interactive web application for visualizing digital signal line coding techniques including NRZ-L, RZ, Manchester, and AMI encoding schemes.

## ✨ Features

- 🎨 **Beautiful Modern UI** - Glassmorphism design with animated gradients
- 📊 **Interactive Visualizations** - Real-time waveform plotting using Plotly.js
- 📈 **Spectral Efficiency Analysis** - Power Spectral Density (PSD) and efficiency metrics
- 🎲 **Random Bit Generation** - Generate random binary sequences
- ✏️ **Custom Input** - Manually enter your own binary data
- 🎛️ **Adjustable Parameters** - Control number of bits and samples per bit
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Flask application:**
   ```bash
   python app.py
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5000`

## 🎯 How to Use

1. **Generate Random Bits:**
   - Adjust the "Number of Bits" slider (4-20 bits)
   - Click the "🎲 Generate Random" button
   - The application will automatically encode and visualize the data

2. **Enter Custom Data:**
   - Type your binary sequence in the input field (e.g., `1010101010`)
   - Adjust "Samples per Bit" if needed (50-200)
   - Click "🚀 Encode & Visualize"

3. **View Waveforms:**
   - The visualization shows 5 stacked plots:
     - Original Binary Data
     - NRZ-L Encoded Signal
     - RZ Encoded Signal
     - Manchester Encoded Signal
     - AMI Encoded Signal

4. **Spectral Efficiency Analysis:**
   - Click "📊 Spectral Analysis" button after encoding data
   - View Power Spectral Density (PSD) comparison chart
   - Analyze spectral efficiency metrics for each encoding scheme:
     - **Spectral Efficiency** (bits/Hz) - Higher is better
     - **Bandwidth (90% Power)** - Frequency containing 90% of signal power
     - **Bandwidth Efficiency** - Lower values indicate better efficiency
     - **DC Component** - Percentage of power at DC (0 Hz)
     - **Peak Frequency** - Frequency with maximum power

## 📚 Encoding Schemes Explained

### NRZ-L (Non-Return-to-Zero-Level)
- **1** → +V voltage
- **0** → -V voltage

### RZ (Return-to-Zero)
- **1** → +V for half bit, 0 for half bit
- **0** → -V for half bit, 0 for half bit

### Manchester
- **1** → Low-to-High transition at mid-bit
- **0** → High-to-Low transition at mid-bit

### AMI (Alternate Mark Inversion)
- **0** → 0V
- **1** → Alternates between +V and -V

## 🛠️ Project Structure

```
LineCodingPrefinal/
├── app.py                 # Flask backend server
├── main.py                # Original Python script
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css    # Styling
│   └── js/
│       └── app.js        # Interactive functionality
└── plots/                # Generated plot images
```

## 🎨 UI Features

- **Animated Background** - Rotating gradient waves
- **Glass Morphism** - Modern translucent UI elements
- **Smooth Animations** - Fade-in effects and transitions
- **Interactive Charts** - Zoom, pan, and hover tooltips
- **Color-Coded Schemes** - Each encoding has a unique color

## 🔧 API Endpoints

### POST `/api/generate`
Generate random binary data.

**Request:**
```json
{
  "num_bits": 10
}
```

**Response:**
```json
{
  "bits": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
}
```

### POST `/api/encode`
Encode binary data using all line coding schemes.

**Request:**
```json
{
  "bits": [1, 0, 1, 0, 1],
  "samples_per_bit": 100
}
```

**Response:**
```json
{
  "time": [0.0, 0.01, ...],
  "original": [1, 1, ..., 0, 0, ...],
  "nrz_l": [1, 1, ..., -1, -1, ...],
  "rz": [1, 1, ..., -1, -1, ...],
  "manchester": [-1, -1, ..., 1, 1, ...],
  "ami": [1, 1, ..., 0, 0, ...]
}
```

### POST `/api/spectral-analysis`
Perform spectral efficiency analysis on encoded signals.

**Request:**
```json
{
  "bits": [1, 0, 1, 0, 1],
  "samples_per_bit": 100,
  "data_rate": 1.0
}
```

**Response:**
```json
{
  "nrz_l": {
    "frequencies_fft": [0.0, 0.01, ...],
    "magnitude": [1.0, 0.95, ...],
    "frequencies_psd": [0.0, 0.01, ...],
    "psd": [1.0, 0.92, ...],
    "metrics": {
      "dc_component": 45.23,
      "bandwidth_90": 2.5,
      "spectral_efficiency": 0.4,
      "peak_frequency": 0.0,
      "bandwidth_efficiency": 2.5,
      "total_power": 1000.0
    }
  },
  "rz": { ... },
  "manchester": { ... },
  "ami": { ... }
}
```

## 📝 Notes

- The application uses Flask for the backend and Plotly.js for interactive visualizations
- All encoding functions are based on the original `main.py` implementation
- The UI is fully responsive and works on modern browsers

## 📊 Spectral Efficiency Metrics

The application calculates and displays several key metrics:

- **Spectral Efficiency (bits/Hz)**: Data rate per unit bandwidth - higher values indicate better spectrum utilization
- **Bandwidth (90% Power)**: Frequency range containing 90% of the signal's power
- **Bandwidth Efficiency**: Ratio of bandwidth to data rate - lower values are better
- **DC Component**: Percentage of signal power at 0 Hz - important for AC-coupled systems
- **Peak Frequency**: Dominant frequency component in the signal

### Typical Characteristics:

- **NRZ-L**: High DC component, concentrated low-frequency spectrum
- **RZ**: Wider bandwidth, lower DC component, more high-frequency content
- **Manchester**: No DC component, energy centered around data rate frequency
- **AMI**: Low DC component, alternates polarity reduces bandwidth requirements

## 🎓 Educational Use

This application is perfect for:
- Understanding line coding principles
- Visualizing signal encoding techniques
- Comparing different encoding schemes
- **Evaluating spectral efficiency and bandwidth requirements**
- Teaching digital communications concepts
- **Analyzing power spectral density characteristics**

## 📄 License

This project is created for educational purposes in Principles of Communication course.

---

**Enjoy visualizing line coding! ⚡📊**

