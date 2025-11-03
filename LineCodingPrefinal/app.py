from flask import Flask, render_template, jsonify, request
import numpy as np
from scipy import signal as scipy_signal
import json

app = Flask(__name__)

# Line coding encoding functions (from main.py)
def encode_nrz_l(data, samples_per_bit):
    """Encodes binary data using Non-Return-to-Zero-Level (NRZ-L)."""
    data_upsampled = np.repeat(data, samples_per_bit)
    return np.where(data_upsampled == 1, 1, -1).tolist()

def encode_rz(data, samples_per_bit):
    """Encodes binary data using Polar Return-to-Zero (RZ)."""
    total_samples = len(data) * samples_per_bit
    rz_signal = np.zeros(total_samples)
    half_bit_samples = samples_per_bit // 2
    
    for i, bit in enumerate(data):
        start_index = i * samples_per_bit
        mid_index = start_index + half_bit_samples
        
        if bit == 1:
            rz_signal[start_index:mid_index] = 1
        else:
            rz_signal[start_index:mid_index] = -1
            
    return rz_signal.tolist()

def encode_manchester(data, samples_per_bit):
    """Encodes binary data using Manchester encoding."""
    total_samples = len(data) * samples_per_bit
    manchester_signal = np.zeros(total_samples)
    half_bit_samples = samples_per_bit // 2
    
    for i, bit in enumerate(data):
        start_index = i * samples_per_bit
        mid_index = start_index + half_bit_samples
        end_index = start_index + samples_per_bit
        
        if bit == 1:
            manchester_signal[start_index:mid_index] = -1
            manchester_signal[mid_index:end_index] = 1
        else:
            manchester_signal[start_index:mid_index] = 1
            manchester_signal[mid_index:end_index] = -1
            
    return manchester_signal.tolist()

def encode_ami(data, samples_per_bit):
    """Encodes binary data using Alternate Mark Inversion (AMI)."""
    total_samples = len(data) * samples_per_bit
    ami_signal = np.zeros(total_samples)
    last_polarity = 1
    
    for i, bit in enumerate(data):
        if bit == 1:
            start_index = i * samples_per_bit
            end_index = start_index + samples_per_bit
            ami_signal[start_index:end_index] = last_polarity
            last_polarity *= -1
            
    return ami_signal.tolist()

# Spectral Analysis Functions
def calculate_fft(signal_array, sampling_rate):
    """Calculate FFT and frequency spectrum of a signal."""
    signal = np.array(signal_array)
    n = len(signal)
    
    # Compute FFT
    fft_vals = np.fft.fft(signal)
    fft_magnitude = np.abs(fft_vals)
    
    # Frequency axis (normalized by Nyquist frequency)
    freqs = np.fft.fftfreq(n, 1/sampling_rate)
    
    # Only return positive frequencies (first half)
    positive_freq_idx = freqs >= 0
    freqs_positive = freqs[positive_freq_idx]
    magnitude_positive = fft_magnitude[positive_freq_idx]
    
    # Normalize
    magnitude_normalized = magnitude_positive / np.max(magnitude_positive) if np.max(magnitude_positive) > 0 else magnitude_positive
    
    return freqs_positive.tolist(), magnitude_normalized.tolist()

def calculate_psd(signal_array, sampling_rate):
    """Calculate Power Spectral Density using Welch's method."""
    signal = np.array(signal_array)
    
    # Use Welch's method for better spectral estimation
    freqs, psd = scipy_signal.welch(signal, sampling_rate, nperseg=min(256, len(signal)//4))
    
    # Normalize
    psd_normalized = psd / np.max(psd) if np.max(psd) > 0 else psd
    
    return freqs.tolist(), psd_normalized.tolist()

def calculate_spectral_efficiency_metrics(signal_array, data_rate, sampling_rate):
    """Calculate spectral efficiency metrics."""
    signal = np.array(signal_array)
    
    # Calculate FFT
    fft_vals = np.fft.fft(signal)
    n = len(signal)
    freqs = np.fft.fftfreq(n, 1/sampling_rate)
    psd = np.abs(fft_vals) ** 2
    
    # Only positive frequencies
    positive_idx = freqs >= 0
    freqs_positive = freqs[positive_idx]
    psd_positive = psd[positive_idx]
    
    # Calculate DC component (power at 0 Hz)
    dc_power = psd_positive[0] if len(psd_positive) > 0 else 0
    total_power = np.sum(psd_positive)
    dc_percentage = (dc_power / total_power * 100) if total_power > 0 else 0
    
    # Calculate bandwidth (frequency where 90% of power is contained)
    cumulative_power = np.cumsum(psd_positive)
    total_power_90 = total_power * 0.9
    bandwidth_idx = np.where(cumulative_power >= total_power_90)[0]
    bandwidth_90 = freqs_positive[bandwidth_idx[0]] if len(bandwidth_idx) > 0 else freqs_positive[-1]
    
    # Spectral efficiency (bits per Hz)
    spectral_efficiency = data_rate / bandwidth_90 if bandwidth_90 > 0 else 0
    
    # Find peak frequency
    peak_idx = np.argmax(psd_positive[1:]) + 1  # Skip DC component
    peak_frequency = freqs_positive[peak_idx] if peak_idx < len(freqs_positive) else 0
    
    # Bandwidth efficiency (normalized by data rate)
    bandwidth_efficiency = bandwidth_90 / data_rate if data_rate > 0 else 0
    
    return {
        'dc_component': float(dc_percentage),
        'bandwidth_90': float(bandwidth_90),
        'spectral_efficiency': float(spectral_efficiency),
        'peak_frequency': float(peak_frequency),
        'bandwidth_efficiency': float(bandwidth_efficiency),
        'total_power': float(total_power)
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/encode', methods=['POST'])
def encode():
    try:
        data = request.json
        bits = data.get('bits', [])
        samples_per_bit = int(data.get('samples_per_bit', 100))
        
        if not bits:
            return jsonify({'error': 'No bits provided'}), 400
        
        # Convert to numpy array
        data_array = np.array(bits)
        
        # Generate time array
        T = len(bits) / 1.0  # Assuming data_rate = 1
        time_array = np.linspace(0, T, len(bits) * samples_per_bit, endpoint=False).tolist()
        
        # Create upsampled original data
        data_upsampled = np.repeat(data_array, samples_per_bit).tolist()
        
        # Encode using all schemes
        nrz_l = encode_nrz_l(data_array, samples_per_bit)
        rz = encode_rz(data_array, samples_per_bit)
        manchester = encode_manchester(data_array, samples_per_bit)
        ami = encode_ami(data_array, samples_per_bit)
        
        return jsonify({
            'time': time_array,
            'original': data_upsampled,
            'nrz_l': nrz_l,
            'rz': rz,
            'manchester': manchester,
            'ami': ami
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        N = int(data.get('num_bits', 10))
        
        # Generate random binary data
        bits = np.random.randint(0, 2, N).tolist()
        
        return jsonify({'bits': bits})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/spectral-analysis', methods=['POST'])
def spectral_analysis():
    try:
        data = request.json
        bits = data.get('bits', [])
        samples_per_bit = int(data.get('samples_per_bit', 100))
        data_rate = float(data.get('data_rate', 1.0))  # Bits per second
        
        if not bits:
            return jsonify({'error': 'No bits provided'}), 400
        
        # Convert to numpy array
        data_array = np.array(bits)
        
        # Calculate sampling rate
        sampling_rate = samples_per_bit * data_rate
        
        # Encode using all schemes
        nrz_l_signal = np.array(encode_nrz_l(data_array, samples_per_bit))
        rz_signal = np.array(encode_rz(data_array, samples_per_bit))
        manchester_signal = np.array(encode_manchester(data_array, samples_per_bit))
        ami_signal = np.array(encode_ami(data_array, samples_per_bit))
        
        # Calculate PSD for each encoding
        results = {}
        
        for name, signal in [('nrz_l', nrz_l_signal), ('rz', rz_signal), 
                             ('manchester', manchester_signal), ('ami', ami_signal)]:
            # Calculate frequency domain
            freqs_fft, magnitude = calculate_fft(signal, sampling_rate)
            freqs_psd, psd = calculate_psd(signal, sampling_rate)
            
            # Calculate metrics
            metrics = calculate_spectral_efficiency_metrics(signal, data_rate, sampling_rate)
            
            results[name] = {
                'frequencies_fft': freqs_fft[:len(freqs_fft)//2],  # Limit for performance
                'magnitude': magnitude[:len(magnitude)//2],
                'frequencies_psd': freqs_psd,
                'psd': psd,
                'metrics': metrics
            }
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

