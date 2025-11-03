// Global variables
let currentData = null;
let currentTime = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeSliders();
    initializeButtons();
    generateRandomBits();
});

// Initialize slider event listeners
function initializeSliders() {
    const numBitsSlider = document.getElementById('num-bits');
    const numBitsValue = document.getElementById('num-bits-value');
    const samplesSlider = document.getElementById('samples-per-bit');
    const samplesValue = document.getElementById('samples-per-bit-value');

    numBitsSlider.addEventListener('input', (e) => {
        numBitsValue.textContent = e.target.value;
    });

    samplesSlider.addEventListener('input', (e) => {
        samplesValue.textContent = e.target.value;
    });
}

// Initialize button event listeners
function initializeButtons() {
    document.getElementById('generate-btn').addEventListener('click', generateRandomBits);
    document.getElementById('encode-btn').addEventListener('click', encodeAndVisualize);
    document.getElementById('spectral-btn').addEventListener('click', performSpectralAnalysis);
    document.getElementById('clear-btn').addEventListener('click', clearInput);
    
    // Allow Enter key to encode
    document.getElementById('bit-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            encodeAndVisualize();
        }
    });
}

// Generate random bits
async function generateRandomBits() {
    const numBits = parseInt(document.getElementById('num-bits').value);
    const loadingDiv = document.getElementById('chart-loading');
    const chartDiv = document.getElementById('waveform-chart');
    
    try {
        loadingDiv.style.display = 'flex';
        
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ num_bits: numBits })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Update input field
        document.getElementById('bit-input').value = data.bits.join('');
        
        // Encode and visualize
        await encodeData(data.bits);
        
    } catch (error) {
        console.error('Error generating bits:', error);
        alert('Error generating random bits: ' + error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Encode and visualize from input or current data
async function encodeAndVisualize() {
    const input = document.getElementById('bit-input').value.trim();
    const loadingDiv = document.getElementById('chart-loading');
    
    if (!input) {
        alert('Please enter binary data or generate random bits!');
        return;
    }

    // Validate input (only 0s and 1s)
    if (!/^[01]+$/.test(input)) {
        alert('Please enter only binary digits (0 and 1)!');
        return;
    }

    try {
        loadingDiv.style.display = 'flex';
        
        const bits = input.split('').map(Number);
        await encodeData(bits);
        
    } catch (error) {
        console.error('Error encoding:', error);
        alert('Error encoding data: ' + error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Encode data and create visualization
async function encodeData(bits) {
    const samplesPerBit = parseInt(document.getElementById('samples-per-bit').value);
    
    try {
        const response = await fetch('/api/encode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bits: bits,
                samples_per_bit: samplesPerBit
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        currentData = data;
        currentTime = data.time;
        
        createVisualization(data);
        
    } catch (error) {
        console.error('Error encoding data:', error);
        throw error;
    }
}

// Create Plotly visualization
function createVisualization(data) {
    // Color scheme for each encoding
    const colors = {
        original: '#4A90E2',
        nrz_l: '#E74C3C',
        rz: '#2ECC71',
        manchester: '#9B59B6',
        ami: '#F39C12'
    };
    
    // Create subplots
    const fig = {
        data: [],
        layout: {
            title: {
                text: '⚡ Line Coding Waveform Visualization',
                font: {
                    size: 24,
                    color: '#ffffff',
                    family: 'Poppins, sans-serif'
                },
                x: 0.5,
                xanchor: 'center'
            },
            grid: {
                rows: 5,
                columns: 1,
                pattern: 'independent',
                rowwidth: [0.2, 0.2, 0.2, 0.2, 0.2],
                roworder: 'top to bottom'
            },
            paper_bgcolor: 'rgba(0, 0, 0, 0)',
            plot_bgcolor: 'rgba(0, 0, 0, 0.2)',
            font: {
                family: 'Poppins, sans-serif',
                color: '#ffffff'
            },
            margin: { l: 60, r: 30, t: 80, b: 60 },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                bordercolor: '#667eea',
                font: {
                    color: '#ffffff',
                    family: 'Poppins, sans-serif'
                }
            }
        },
        config: {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'line_coding_waveforms',
                height: 1000,
                width: 1200,
                scale: 2
            }
        }
    };

    // Helper function to create axis config
    const createAxisConfig = (row, title, range = null) => {
        const config = {
            title: {
                text: title,
                font: {
                    color: '#ffffff',
                    size: 12
                }
            },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            zerolinecolor: 'rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            showgrid: true
        };
        if (range) {
            config.range = range;
        }
        return config;
    };

    // Original data (row 1)
    fig.data.push({
        x: data.time,
        y: data.original,
        type: 'scatter',
        mode: 'lines',
        name: 'Original Binary Data',
        line: {
            color: colors.original,
            width: 2,
            shape: 'hv'
        },
        fill: 'tozeroy',
        fillcolor: `rgba(74, 144, 226, 0.2)`,
        hovertemplate: '<b>Original Data</b><br>Time: %{x:.3f} s<br>Value: %{y}<extra></extra>',
        xaxis: 'x',
        yaxis: 'y'
    });
    fig.layout['xaxis'] = createAxisConfig(1, '');
    fig.layout['yaxis'] = createAxisConfig(1, 'Binary', [0, 1.2]);

    // NRZ-L (row 2)
    fig.data.push({
        x: data.time,
        y: data.nrz_l,
        type: 'scatter',
        mode: 'lines',
        name: 'NRZ-L Encoded Signal',
        line: {
            color: colors.nrz_l,
            width: 2,
            shape: 'hv'
        },
        fill: 'tozeroy',
        fillcolor: `rgba(231, 76, 60, 0.2)`,
        hovertemplate: '<b>NRZ-L</b><br>Time: %{x:.3f} s<br>Voltage: %{y:.2f} V<extra></extra>',
        xaxis: 'x2',
        yaxis: 'y2'
    });
    fig.layout['xaxis2'] = createAxisConfig(2, '');
    fig.layout['yaxis2'] = createAxisConfig(2, 'NRZ-L', [-1.2, 1.2]);

    // RZ (row 3)
    fig.data.push({
        x: data.time,
        y: data.rz,
        type: 'scatter',
        mode: 'lines',
        name: 'RZ Encoded Signal',
        line: {
            color: colors.rz,
            width: 2,
            shape: 'hv'
        },
        fill: 'tozeroy',
        fillcolor: `rgba(46, 204, 113, 0.2)`,
        hovertemplate: '<b>RZ</b><br>Time: %{x:.3f} s<br>Voltage: %{y:.2f} V<extra></extra>',
        xaxis: 'x3',
        yaxis: 'y3'
    });
    fig.layout['xaxis3'] = createAxisConfig(3, '');
    fig.layout['yaxis3'] = createAxisConfig(3, 'RZ', [-1.2, 1.2]);

    // Manchester (row 4)
    fig.data.push({
        x: data.time,
        y: data.manchester,
        type: 'scatter',
        mode: 'lines',
        name: 'Manchester Encoded Signal',
        line: {
            color: colors.manchester,
            width: 2,
            shape: 'hv'
        },
        fill: 'tozeroy',
        fillcolor: `rgba(155, 89, 182, 0.2)`,
        hovertemplate: '<b>Manchester</b><br>Time: %{x:.3f} s<br>Voltage: %{y:.2f} V<extra></extra>',
        xaxis: 'x4',
        yaxis: 'y4'
    });
    fig.layout['xaxis4'] = createAxisConfig(4, '');
    fig.layout['yaxis4'] = createAxisConfig(4, 'Manchester', [-1.2, 1.2]);

    // AMI (row 5)
    fig.data.push({
        x: data.time,
        y: data.ami,
        type: 'scatter',
        mode: 'lines',
        name: 'AMI Encoded Signal',
        line: {
            color: colors.ami,
            width: 2,
            shape: 'hv'
        },
        fill: 'tozeroy',
        fillcolor: `rgba(243, 156, 18, 0.2)`,
        hovertemplate: '<b>AMI</b><br>Time: %{x:.3f} s<br>Voltage: %{y:.2f} V<extra></extra>',
        xaxis: 'x5',
        yaxis: 'y5'
    });
    fig.layout['xaxis5'] = createAxisConfig(5, 'Time (seconds)');
    fig.layout['yaxis5'] = createAxisConfig(5, 'AMI', [-1.2, 1.2]);

    // Create the plot
    Plotly.newPlot('waveform-chart', fig.data, fig.layout, fig.config);
    
    // Add smooth animation
    animateChart();
}

// Animate chart appearance
function animateChart() {
    const chartDiv = document.getElementById('waveform-chart');
    chartDiv.style.opacity = '0';
    chartDiv.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        chartDiv.style.transition = 'all 0.5s ease-out';
        chartDiv.style.opacity = '1';
        chartDiv.style.transform = 'translateY(0)';
    }, 100);
}

// Clear input field
function clearInput() {
    document.getElementById('bit-input').value = '';
    document.getElementById('bit-input').focus();
}

// Perform Spectral Analysis
async function performSpectralAnalysis() {
    const input = document.getElementById('bit-input').value.trim();
    const loadingDiv = document.getElementById('psd-loading');
    const spectralSection = document.getElementById('spectral-section');
    const samplesPerBit = parseInt(document.getElementById('samples-per-bit').value);
    
    if (!input) {
        alert('Please encode some data first or generate random bits!');
        return;
    }

    // Validate input
    if (!/^[01]+$/.test(input)) {
        alert('Please enter only binary digits (0 and 1)!');
        return;
    }

    try {
        // Show spectral section
        spectralSection.style.display = 'block';
        loadingDiv.style.display = 'flex';
        
        // Scroll to spectral section
        spectralSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        const bits = input.split('').map(Number);
        const dataRate = 1.0; // Bits per second
        
        const response = await fetch('/api/spectral-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bits: bits,
                samples_per_bit: samplesPerBit,
                data_rate: dataRate
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Create PSD visualization
        createPSDVisualization(data);
        
        // Display metrics
        displaySpectralMetrics(data);
        
    } catch (error) {
        console.error('Error in spectral analysis:', error);
        alert('Error performing spectral analysis: ' + error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Create PSD Visualization
function createPSDVisualization(spectralData) {
    const colors = {
        nrz_l: '#E74C3C',
        rz: '#2ECC71',
        manchester: '#9B59B6',
        ami: '#F39C12'
    };
    
    const names = {
        nrz_l: 'NRZ-L',
        rz: 'RZ',
        manchester: 'Manchester',
        ami: 'AMI'
    };
    
    const traces = [];
    
    // Create traces for each encoding scheme
    for (const [key, name] of Object.entries(names)) {
        if (spectralData[key]) {
            const schemeData = spectralData[key];
            traces.push({
                x: schemeData.frequencies_psd,
                y: schemeData.psd,
                type: 'scatter',
                mode: 'lines',
                name: name,
                line: {
                    color: colors[key],
                    width: 2
                },
                fill: 'tozeroy',
                fillcolor: colors[key] + '40', // Add transparency
                hovertemplate: `<b>${name}</b><br>Frequency: %{x:.3f} Hz<br>PSD: %{y:.4f}<extra></extra>`
            });
        }
    }
    
    const layout = {
        title: {
            text: '📊 Power Spectral Density (PSD) Comparison',
            font: {
                size: 22,
                color: '#ffffff',
                family: 'Poppins, sans-serif'
            },
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: {
            title: {
                text: 'Frequency (Hz)',
                font: {
                    color: '#ffffff',
                    size: 14
                }
            },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            zerolinecolor: 'rgba(255, 255, 255, 0.3)',
            color: '#ffffff'
        },
        yaxis: {
            title: {
                text: 'Normalized PSD',
                font: {
                    color: '#ffffff',
                    size: 14
                }
            },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            zerolinecolor: 'rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            type: 'log'
        },
        paper_bgcolor: 'rgba(0, 0, 0, 0)',
        plot_bgcolor: 'rgba(0, 0, 0, 0.2)',
        font: {
            family: 'Poppins, sans-serif',
            color: '#ffffff'
        },
        margin: { l: 70, r: 30, t: 80, b: 60 },
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            bordercolor: '#667eea',
            font: {
                color: '#ffffff',
                family: 'Poppins, sans-serif'
            }
        },
        legend: {
            x: 0.5,
            y: -0.2,
            xanchor: 'center',
            orientation: 'h',
            font: {
                color: '#ffffff',
                size: 12
            },
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            bordercolor: 'rgba(255, 255, 255, 0.2)',
            borderwidth: 1
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: 'spectral_analysis',
            height: 600,
            width: 1200,
            scale: 2
        }
    };
    
    Plotly.newPlot('psd-chart', traces, layout, config);
}

// Display Spectral Metrics
function displaySpectralMetrics(spectralData) {
    const metricsGrid = document.getElementById('metrics-grid');
    metricsGrid.innerHTML = '';
    
    const names = {
        nrz_l: { name: 'NRZ-L', icon: '📊' },
        rz: { name: 'RZ', icon: '📈' },
        manchester: { name: 'Manchester', icon: '📉' },
        ami: { name: 'AMI', icon: '📋' }
    };
    
    const colors = {
        nrz_l: '#E74C3C',
        rz: '#2ECC71',
        manchester: '#9B59B6',
        ami: '#F39C12'
    };
    
    // Find best values for comparison
    let bestSpectralEff = -1, bestSchemeSE = '';
    let bestBandwidthEff = Infinity, bestSchemeBE = '';
    let lowestDC = Infinity, bestSchemeDC = '';
    
    for (const [key, data] of Object.entries(spectralData)) {
        const metrics = data.metrics;
        if (metrics.spectral_efficiency > bestSpectralEff) {
            bestSpectralEff = metrics.spectral_efficiency;
            bestSchemeSE = key;
        }
        if (metrics.bandwidth_efficiency < bestBandwidthEff) {
            bestBandwidthEff = metrics.bandwidth_efficiency;
            bestSchemeBE = key;
        }
        if (metrics.dc_component < lowestDC) {
            lowestDC = metrics.dc_component;
            bestSchemeDC = key;
        }
    }
    
    // Create metric cards
    for (const [key, info] of Object.entries(names)) {
        if (spectralData[key]) {
            const metrics = spectralData[key].metrics;
            const card = document.createElement('div');
            card.className = 'metric-card';
            card.style.borderLeft = `4px solid ${colors[key]}`;
            
            card.innerHTML = `
                <div class="metric-header">
                    <span class="metric-icon">${info.icon}</span>
                    <h4>${info.name}</h4>
                </div>
                <div class="metric-row">
                    <span class="metric-row-label">Spectral Efficiency</span>
                    <span class="metric-row-value">
                        ${metrics.spectral_efficiency.toFixed(3)} bits/Hz
                        ${key === bestSchemeSE ? '<span class="metric-badge badge-best">Best</span>' : ''}
                    </span>
                </div>
                <div class="metric-row">
                    <span class="metric-row-label">Bandwidth (90% Power)</span>
                    <span class="metric-row-value">${metrics.bandwidth_90.toFixed(3)} Hz</span>
                </div>
                <div class="metric-row">
                    <span class="metric-row-label">Bandwidth Efficiency</span>
                    <span class="metric-row-value">
                        ${metrics.bandwidth_efficiency.toFixed(3)}
                        ${key === bestSchemeBE ? '<span class="metric-badge badge-best">Best</span>' : ''}
                    </span>
                </div>
                <div class="metric-row">
                    <span class="metric-row-label">DC Component</span>
                    <span class="metric-row-value">
                        ${metrics.dc_component.toFixed(2)}%
                        ${key === bestSchemeDC ? '<span class="metric-badge badge-best">Best</span>' : ''}
                    </span>
                </div>
                <div class="metric-row">
                    <span class="metric-row-label">Peak Frequency</span>
                    <span class="metric-row-value">${metrics.peak_frequency.toFixed(3)} Hz</span>
                </div>
            `;
            
            metricsGrid.appendChild(card);
        }
    }
}

