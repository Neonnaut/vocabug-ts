import matplotlib.pyplot as plt
import numpy as np

# Custom grey-tan background style
plt.style.use('default')  # Start from the default style
plt.rcParams.update({
    'axes.facecolor': '#ccc',   # light tan
    'figure.facecolor': '#ccc', # same for figure background
    'savefig.facecolor': "#ccc"
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

shallow = [0.13901743348074713, 0.09893490636234296, 0.08191613674491292, 0.07224552342018788, 0.06600031483456682, 0.061676836798982726, 0.0585604331013509, 0.05626328974769393, 0.054555004767525964, 0.05328938337506795, 0.05236892669848462, 0.051726048083671816, 0.05131244472292722, 0.05109274965319489, 0.05104056820834216] 

plt.figure(figsize=(10, 6))
plt.plot(x, flat, label='Flat', linewidth=2, color='purple', linestyle=':')  # dotted
plt.plot(x, gusein_zade, label='Gusein-Zade', linewidth=2, color='green', linestyle='--')     # solid
plt.plot(x, zipfian, label='Zipfian', linewidth=2, color='blue', linestyle='-')
plt.plot(x, shallow, label='Shallow', linewidth=2, color='darkred', linestyle='-')     # dashed



plt.xscale('log')  # keep log scale for x-axis
plt.xticks(x, labels=[str(i) for i in x])
plt.xlim(left=1)

plt.title('Distributions', fontsize=14)
plt.xlabel('Ranked Items (log scale)', fontsize=12)
plt.ylabel('Frequency', fontsize=12)
plt.grid(True, linestyle='--', alpha=0.4, which='both')
plt.legend()
plt.tight_layout()
plt.show()