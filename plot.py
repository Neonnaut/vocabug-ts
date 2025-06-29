import matplotlib.pyplot as plt
import numpy as np

# Custom grey-tan background style
plt.style.use('default')  # Start from the default style
plt.rcParams.update({
    'axes.facecolor': '#e4ded2',   # light tan
    'figure.facecolor': '#e4ded2', # same for figure background
    'savefig.facecolor': "#e4ded2"
})

x = np.arange(1, 16)
gusein_zade = [0.20253308606576337, 0.15189981454932253, 0.12228124942337201, 0.10126654303288168,
               0.08496627039567935, 0.07164797790693117, 0.060387522054204085, 0.050633271516440856,
               0.04202941278098062, 0.03433299887923847, 0.027370745626740654, 0.02101470639049031,
               0.015167717086903622, 0.00975425053776325, 0.004714433753287965]
zipfian = [0.268575772733732, 0.14392619294809625, 0.09992121464406051, 0.07712813708282387,
           0.06309483806150885, 0.053546453099948446, 0.04660994580079748, 0.04133194527011601,
           0.03717479441395062, 0.03381168652867502, 0.03103226085776639, 0.028694833722734483,
           0.02670040302855968, 0.024977651499774833, 0.02347387030745549]
flat = [0.06666666666666667] * 15

shallow = [0.14680074995413386, 0.1041641864838218, 0.085691719877115, 0.07494267288304018, 0.06779890381385352, 0.06267674445247913, 0.058820971812357715, 0.05582020541002092, 0.05342895990447147, 0.05149063814405481, 0.049900117231705315, 0.04858392746879734, 0.04748901910430586, 0.046576041893307246, 0.045815141566535676]

plt.figure(figsize=(10, 6))
plt.plot(x, zipfian, label='Zipfian', linewidth=2, color='red', linestyle='-')                    # dashed
plt.plot(x, gusein_zade, label='Gusein-Zade', linewidth=2, color='green', linestyle='--')     # solid
plt.plot(x, shallow, label='Shallow', linewidth=2, color='deepskyblue', linestyle='-')  
plt.plot(x, flat, label='Flat', linewidth=2, color='purple', linestyle=':')                         # dotted


plt.xscale('log')  # keep log scale for x-axis
plt.xticks(x, labels=[str(i) for i in x])
plt.xlim(left=1)

plt.title('Distributions with Logarithmic Rank Axis', fontsize=14)
plt.xlabel('Ranked Items (log scale)', fontsize=12)
plt.ylabel('Frequency', fontsize=12)
plt.grid(True, linestyle='--', alpha=0.4, which='both')
plt.legend()
plt.tight_layout()
plt.show()