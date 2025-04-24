import numpy as np
def scanxz(filename):
    with open(filename, 'r') as file:
        data = np.loadtxt(file, dtype=float)
        x, z = data.T[0], data.T[1]
    return x,z
