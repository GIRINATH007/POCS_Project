import numpy as np
import matplotlib.pyplot as plt
from scipy import signal # We'll use this later for spectral analysis

# --- Step 1: Setup & Data Generation ---

# 1. Define Signal Parameters
N = 10                # Number of bits to generate
data_rate = 1         # Bits per second (1 Hz)
samples_per_bit = 100 # How many "samples" to use to represent 1 bit (for a clear plot)
T = N / data_rate     # Total time of the signal (in seconds)
Fs = samples_per_bit * data_rate # Sampling frequency of our simulation (100 Hz)

# 2. Generate Random Binary Data
# Creates an array of N random 0s and 1s
data = np.random.randint(0, 2, N)

# 3. Create the "upsampled" signal shape for plotting
# We repeat each bit 'samples_per_bit' times to create the blocky signal shape
# Example: [1, 0] -> [1, 1, ..., 1, 0, 0, ..., 0]
data_upsampled = np.repeat(data, samples_per_bit)

# 4. Create the time axis for our plots
# We need a time value for each sample in data_upsampled
# Total samples = N * samples_per_bit
t = np.linspace(0, T, N * samples_per_bit, endpoint=False)

# 5. --- Test Print ---
# Let's print the data to see what we generated
print(f"Generated {N} random bits: {data}")
print(f"Total samples in simulation: {len(data_upsampled)}")


# --- Step 2: Implement Line Coding Functions ---
def encode_nrz_l(data, samples_per_bit):
    """
    Encodes binary data using Non-Return-to-Zero-Level (NRZ-L).
    1 -> +V, 0 -> -V
    """
    # Upsample the data
    data_upsampled = np.repeat(data, samples_per_bit)
    # Map 1 to 1, 0 to -1
    return np.where(data_upsampled == 1, 1, -1)


def encode_rz(data, samples_per_bit):
    """
    Encodes binary data using Polar Return-to-Zero (RZ).
    1 -> +V for half bit, 0 for half bit
    0 -> -V for half bit, 0 for half bit
    """
    total_samples = len(data) * samples_per_bit
    rz_signal = np.zeros(total_samples)
    half_bit_samples = samples_per_bit // 2
    
    for i, bit in enumerate(data):
        start_index = i * samples_per_bit
        mid_index = start_index + half_bit_samples
        
        if bit == 1:
            rz_signal[start_index:mid_index] = 1
            # The rest of the bit period is already 0
        else: # bit == 0
            rz_signal[start_index:mid_index] = -1
            # The rest of the bit period is already 0
            
    return rz_signal


def encode_manchester(data, samples_per_bit):
    """
    Encodes binary data using Manchester encoding.
    1 -> Low-to-High transition at mid-bit
    0 -> High-to-Low transition at mid-bit
    """
    total_samples = len(data) * samples_per_bit
    manchester_signal = np.zeros(total_samples)
    half_bit_samples = samples_per_bit // 2
    
    for i, bit in enumerate(data):
        start_index = i * samples_per_bit
        mid_index = start_index + half_bit_samples
        end_index = start_index + samples_per_bit
        
        if bit == 1:
            # Low-to-High transition
            manchester_signal[start_index:mid_index] = -1
            manchester_signal[mid_index:end_index] = 1
        else: # bit == 0
            # High-to-Low transition
            manchester_signal[start_index:mid_index] = 1
            manchester_signal[mid_index:end_index] = -1
            
    return manchester_signal

def encode_ami(data, samples_per_bit):
    """
    Encodes binary data using Alternate Mark Inversion (AMI).
    0 -> 0V
    1 -> Alternates between +V and -V
    """
    total_samples = len(data) * samples_per_bit
    ami_signal = np.zeros(total_samples)
    
    # We need to track the polarity of the last '1' (Mark)
    last_polarity = 1  # Start with +V
    
    for i, bit in enumerate(data):
        if bit == 1:
            # Set the pulse for the entire bit duration
            start_index = i * samples_per_bit
            end_index = start_index + samples_per_bit
            
            ami_signal[start_index:end_index] = last_polarity
            
            # Invert the polarity for the next '1'
            last_polarity *= -1
        
        # If bit is 0, we do nothing (it stays 0)
            
    return ami_signal



# --- Step 3: Waveform Visualization ---

# 1. Encode the data using all schemes
nrz_l_signal = encode_nrz_l(data, samples_per_bit)
rz_signal = encode_rz(data, samples_per_bit)
manchester_signal = encode_manchester(data, samples_per_bit)
ami_signal = encode_ami(data, samples_per_bit)

# 2. Plot the original data and all encoded signals
#    (We now have 5 plots, so nrows=5)
fig, (ax1, ax2, ax3, ax4, ax5) = plt.subplots(nrows=5, ncols=1, sharex=True, figsize=(10, 12))

# Plot 1: Original Data
ax1.step(t, data_upsampled, where='post', color='blue')
ax1.set_title('Original Binary Data')
ax1.set_ylabel('Amplitude')
ax1.set_ylim(-0.2, 1.2)
ax1.grid(True)

# Plot 2: NRZ-L Signal
ax2.plot(t, nrz_l_signal, color='red', drawstyle='steps-post')
ax2.set_title('NRZ-L Encoded Signal')
ax2.set_ylabel('Voltage Level')
ax2.set_ylim(-1.2, 1.2)
ax2.grid(True)

# Plot 3: RZ Signal
ax3.plot(t, rz_signal, color='green', drawstyle='steps-post')
ax3.set_title('RZ Encoded Signal')
ax3.set_ylabel('Voltage Level')
ax3.set_ylim(-1.2, 1.2)
ax3.grid(True)

# Plot 4: Manchester Signal
ax4.plot(t, manchester_signal, color='purple', drawstyle='steps-post')
ax4.set_title('Manchester Encoded Signal')
ax4.set_ylabel('Voltage Level')
ax4.set_ylim(-1.2, 1.2)
ax4.grid(True)

# Plot 5: AMI Signal
ax5.plot(t, ami_signal, color='orange', drawstyle='steps-post')
ax5.set_title('AMI Encoded Signal')
ax5.set_ylabel('Voltage Level')
ax5.set_xlabel('Time (s)')
ax5.set_ylim(-1.2, 1.2)
ax5.grid(True)

# Clean up the plot
fig.tight_layout()

# Save the plot to our 'plots' folder
plt.savefig('plots/all_waveforms.png')

# Display the plot
print("\nShowing all 4 encoding scheme plots...")
plt.show()

print("All plots saved to 'plots/all_waveforms.png'")