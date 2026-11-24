#!/usr/bin/env python3
"""Efeitos sonoros do vídeo B sintetizados só com numpy (sem bibliotecas extras). uso: python3 sfx.py out/sfx.wav"""
import sys, wave, numpy as np
SR = 48000; DUR = 22.0; rng = np.random.default_rng(7)
out = np.zeros(int(SR * DUR))
def put(x, t, g=1.0):
    i = int(t * SR); n = min(len(x), len(out) - i); out[i:i + n] += x[:n] * g
def lp(x, k):                                  # passa-baixa simples (média móvel)
    return np.convolve(x, np.ones(k) / k, mode='same')
def fade(x, a=0.03, b=0.06):
    n = len(x); e = np.ones(n); na, nb = int(a * SR), int(b * SR)
    e[:na] = np.linspace(0, 1, na); e[n - nb:] = np.linspace(1, 0, nb); return x * e
def motor(dur, f0):                            # zumbido de máquina: harmônicos + oscilação leve + chiado
    t = np.arange(int(dur * SR)) / SR; f = f0 * (1 + 0.006 * np.sin(2 * np.pi * 7 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 9)) + 0.25 * lp(rng.standard_normal(len(t)), 6)
    return fade(x / np.max(np.abs(x)))
def clique():
    n = int(0.05 * SR); t = np.arange(n) / SR
    burst = np.diff(rng.standard_normal(n + 1)) * np.exp(-t / 0.004)
    ping = np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.012) * 0.6
    return (burst * 0.5 + ping)
def pop():
    n = int(0.14 * SR); t = np.arange(n) / SR; f = 820 * (300 / 820) ** (t / t[-1])
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.002) * np.exp(-t / 0.035)
def whoosh(d=0.45):
    n = int(d * SR); x = rng.standard_normal(n); y = lp(x, 9) - lp(x, 60)
    return y / np.max(np.abs(y)) * np.sin(np.pi * np.arange(n) / n) ** 1.6
def grave():
    n = int(0.6 * SR); t = np.arange(n) / SR; f = 120 * (42 / 120) ** (t / t[-1]) ** 0.5
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.003) * np.exp(-t / 0.18)
def chiado(d):                                 # pelos caindo na pia
    n = int(d * SR); x = rng.standard_normal(n); return fade(lp(x, 3) - lp(x, 25), 0.2, 0.3)

for a, b, f0, g in [(0.35, 3.0, 118, .16), (3.0, 8.0, 150, .16), (10.75, 13.0, 118, .16), (13.0, 18.0, 112, .15)]:
    put(motor(b - a, f0), a, g)
put(chiado(5.0), 3.0, .05)
for t in [10.2, 19.9, 8.35]: put(clique(), t, .55)
for t in [0.1, 3.0, 8.0, 13.0, 18.0]: put(pop(), t, .35)
for t in [2.85, 7.85, 12.85, 17.8]: put(whoosh(), t, .30)
put(grave(), 18.0, .6)
out /= max(1e-9, np.max(np.abs(out))) / 0.8
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok', sys.argv[1])
