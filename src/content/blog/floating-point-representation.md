---
title: "Floating-Point Representation"
description: "How IEEE 754 packs sign, exponent and fraction into one number: five formats, four encodings, binades and ulp."
pubDate: 2026-04-20
updatedDate: 2026-11-26
tags:
  - floating-point
  - computer-architecture
  - numerical-analysis
lang: "en"
---

In large-model computation the arithmetic that matters is floating-point arithmetic, so understanding floating point is a prerequisite for diagnosing both accuracy and performance problems in AI Infra. This post covers the formats themselves; it is the first of a series, and it lays the ground for rounding, conversion, arithmetic and error analysis.

Like integers, floating-point numbers occupy a fixed width: 64 bits, 32 bits, 16 bits. Unlike integers, they must cover a much wider range. A fixed radix point cannot do both ends: $2^{31}$ needs 32 integer bits, while $2^{-32}$ needs 32 fractional bits. The field settled on the IEEE 754 standard. BF16 and TF32, both common in practice, are outside that standard yet follow the same rules.

FP8 and FP6 and anything narrower are out of scope. The formats discussed here are FP64, FP32, FP16, BF16 and TF32.

## The Layout of a Floating-Point Number

IEEE 754 stores the significant digits and the scale separately, writing the value as

$$
V = (-1)^s \times M \times 2^E,
$$

- $s$ is the sign bit: $0$ for non-negative, $1$ for negative;
- $M$ is the significand, a binary fraction;
- $E$ is the exponent, which scales the number by $2^E$.

The bits are cut into three fields:[^csapp-fmt]

| Field  | Bits | Role |
| ------ | --- | --- |
| `s`    | 1   | sign bit |
| `exp`  | $k$ | the exponent $E$ in biased form |
| `frac` | $n$ | the fractional part of the significand $M$ |

![Field layout of FP64, FP32, TF32, BF16 and FP16](/images/floating-point-representation/float-formats-field-layout.drawio-0bcf04b066.svg)

*The five formats, drawn after CSAPP Figure 2.32. The exponent width sets the dynamic range; the fraction width sets the precision.*

Parameters per format:[^754-params]

| Format | Total bits | Exponent bits $k$ | Fraction bits $n$ | Bias |
| ---- | --- | ------- | ------- | ---- |
| FP64 | 64  | 11      | 52      | 1023 |
| FP32 | 32  | 8       | 23      | 127  |
| TF32 | 19  | 8       | 10      | 127  |
| BF16 | 16  | 8       | 7       | 127  |
| FP16 | 16  | 5       | 10      | 15   |

`exp` holds a biased exponent: $E = e - \text{Bias}$, where $\text{Bias} = 2^{k-1}-1$.

Biased form rather than two's complement, for two reasons:

1. `exp` can be handled as an unsigned integer, which keeps the hardware simple.
2. Order is preserved. Read a bit pattern whose sign bit is 0 as an unsigned integer and its order matches the order of the floating-point values exactly, so sorting non-negative floats collapses into integer sorting. NaN is the exception, since it has no numeric order; the negative half reverses.

Given the bias and the range of `exp`, $E$ lands in $[1, 2^k-2]$ after the shift, while `exp = 0` and `exp = 2^k-1` are reserved for other cases.

## Classes of Floating-Point Numbers

The value of `exp` decides which class a number belongs to.[^csapp-cat]

![Figure 2.33: the four encoding classes in single precision](/images/floating-point-representation/csapp-fig2-33-floating-point-categories.drawio-ef35c8145a.svg)

*CSAPP Figure 2.33: an all-zero `exp` means denormalized, an all-one `exp` splits into $\infty$ and NaN according to whether `frac` is zero, and everything else is normalized.*

### Normalized

Normalized form is the common case.

When $0 < e < 2^k-1$, $E = e - \text{Bias}$ and $M = 1 + f$, where $f$ is the value of `frac` read as $0.f_{n-1}\cdots f_0$.

The hidden leading 1 is a free bit of precision. Since $E$ can always be adjusted so that $1 \le M < 2$, that bit is always 1 and never needs storing, so $n$ stored fraction bits deliver $n+1$ significant bits.

Two consequences follow:

1. Normalized form cannot represent 0, because $M \ge 1$ always holds.
2. A rule is needed for the gap between the smallest normalized number and 0.

The next subsection exists to solve exactly those two problems.

### Denormalized

When $e = 0$, the encoding takes $E = 1 - \text{Bias}$ and $M = f$, with no hidden bit. These are usually called denormalized numbers; IEEE 754-2019 prefers subnormal. This post uses the more common former term, and it also folds 0 into the class, although IEEE does not count 0 as denormalized.[^754-subnormal]

Denormalized numbers serve two purposes:

1. Representing 0, which normalized form cannot encode since $M \ge 1$;
2. Filling the gap between 0 and the smallest normalized number, so values do not fall off a cliff to 0.

The choice $E = 1-\text{Bias}$ differs from the normalized case, and it is deliberate: it compensates for the lost hidden bit, making the step from the largest denormalized number to the smallest normalized number the same as every other step.[^csapp-bias-aside] Take the 6-bit toy format ($k=3$, $n=2$, Bias $=3$). Denormalized numbers use $E = 2^{1-3} = 1/4$ and $M \in \{0, 1/4, 2/4, 3/4\}$, so the largest is $3/16$ and the smallest normalized number is $4/16$: adjacent, with the same step of $1/16$. That is the geometric meaning of **gradual underflow**.[^csapp-gradual] The price is that the number of significant bits falls as values shrink: $4/16$ carries 3 significant bits, $3/16$ carries 2, and $1/16$ only 1.

### Special values

With `exp` all ones:

- `frac = 0`: $\pm\infty$, produced by overflow or division by zero;
- `frac ≠ 0`: NaN, produced by undefined operations such as $\sqrt{-1}$, $\infty - \infty$ or $0/0$.[^754-enc]

$\pm 0$ is encoded as a sign bit plus all-zero fields. The two compare equal in arithmetic yet behave differently for $1/x$, for `atan2`, and for sign extraction.

The value of this design is that arithmetic is closed: every basic operation returns a defined value, an exceptional case leaves a traceable $\infty$ or NaN instead of crashing the program at random.

## Concepts That Follow From the Layout

Once the layout is clear, the quantities people quote about a format follow from it directly.

### Extremes

All four extremes can be read off `exp` and `frac`.

- **Largest normalized**: the largest legal exponent code $e = 2^k-2$ (all ones is reserved), giving $E_{\max} = 2^{k-1}-1$; the fraction is full, $f = 1-2^{-n}$, so $M = 2-2^{-n}$. The value is $(2 - 2^{-n})\,2^{\,2^{k-1}-1}$.
- **Smallest normalized**: the smallest normalized code $e=1$, giving $E = 1 - \text{Bias} = 2-2^{k-1}$; the fraction is minimal, $f=0$, so $M=1$, and the value is $2^{\,2-2^{k-1}}$.
- **Largest denormalized**: $e=0$, giving $E = 1-\text{Bias} = 2-2^{k-1}$; the fraction is full, $f = 1-2^{-n}$, so $M = 1-2^{-n}$, and the value is $(1 - 2^{-n})\,2^{\,2-2^{k-1}}$.
- **Smallest denormalized**: again $e=0$, but with the smallest non-zero fraction $f=2^{-n}$, only the lowest bit set. The value is $2^{-n}\,2^{\,2-2^{k-1}}$.

### Overflow

When a result exceeds the largest finite value of the format, it becomes $\pm\infty$ (65504 for FP16, that is $(2-2^{-10})\times 2^{15}$). Strictly, a value slightly above that bound which still rounds back to it has not overflowed: under FP16's default rounding the threshold sits at 65520, and the exact figure depends on the rounding rule, which this post leaves alone.[^754-overflow]

The exponent width decides how easily a format overflows. FP16 has 5 exponent bits against 8 in BF16, and a correspondingly smaller largest value, so FP16 overflows far more readily.

### Underflow

Below the smallest normalized number lies the denormalized range, where relative precision keeps degrading until the value becomes 0.

Engineering offers two paths:

- **Gradual underflow**, the IEEE default: monotonicity is preserved and values approach 0 smoothly, at the cost of extra hardware handling and slower paths in some implementations.
- **Flush to zero**: separate switches for inputs and outputs. **DAZ** (denormals are zero) reads denormalized operands as 0, while **FTZ** (flush to zero) forces denormalized results to 0. Together they draw a hard boundary below the smallest normalized number, and the visible consequence is a numeric cliff: $x$ just above that boundary stays itself, and just below it becomes 0.

Hardware and compilers differ:

1. x86 follows IEEE by default and exposes FTZ and DAZ as two bits in `MXCSR`, both off by default; turning them on takes denormalized values off the slow path.
2. CUDA follows IEEE by default but allows `-ftz=true` or the per-instruction `.ftz` modifier per kernel. Global-memory atomics on CUDA support only FTZ.
3. Google's TPU simply specifies that BF16 underflow flushes to 0.

### Binade

Resolution is segmented by exponent. Group the numbers sharing an exponent $E$ and the interval

$$
[2^E,\ 2^{E+1}),
$$

is a **binade**. Both ends are powers of two, and every number inside shares the binary exponent $E$, so the index of a binade is the exponent code $e$.

The pattern inside a binade is regular. The fraction is $n$ bits wide, so each binade is paved with $2^n$ evenly spaced fraction codes:

- neighbouring representable values are a constant $2^{E-n}$ apart;
- crossing into the next binade increments `exp` and doubles the step;
- the relative spacing, step divided by value, varies by a factor of 2 within one binade: largest at the low end as $x\to 2^E$, where it is $2^{-n}$, and smallest at the high end as $x\to 2^{E+1}$, where it is $2^{-n-1}$.

For the $n=2$ toy format: step $1/4$ on $[1,2)$, $1/2$ on $[2,4)$, and $1$ on $[4,8)$. So there are twice as many representable values per unit length between $1.0$ and $2.0$ as between $2.0$ and $4.0$.

The number of binades equals the number of legal exponent codes: 254 for BF16 ($E=-126$ to $127$) and only 30 for FP16 ($E=-14$ to $15$). That count is what sets the dynamic range, and it explains why FP16 overflows and underflows so much sooner.

### Unit in the last place

Give the current step a name and it becomes the **unit in the last place, or ulp**. For $x \in [2^E, 2^{E+1})$,

$$
\operatorname{ulp}(x) = 2^{E-n},
$$

an absolute spacing that is constant inside a binade and changes with $E$. The corresponding relative spacing $\operatorname{ulp}(x)/x$ falls from $2^{-n}$ at the low end to $2^{-n-1}$ at the high end, so the relative precision of one format swings by a factor of the base across a binade. Higham calls this wobbling precision.[^higham-wobble]

Concrete numbers: FP32 has an ulp of about $1.2\times10^{-7}$ near $x=1$ and about $1.2\times10^{-4}$ near $x=1024$. An increment of $10^{-5}$ still changes the result when added to 1, and is already less than half an ulp when added to 1024.

### Machine epsilon

**Machine epsilon** $\epsilon_M$ is the distance from 1 to the next larger floating-point number.

$1 = 1.0 \times 2^0$ sits at the bottom of the binade $[1,2)$, whose step is $2^{0-n} = 2^{-n}$, so the next representable number after 1 is $1 + 2^{-n}$:

$$
\epsilon_M = 2^{-n}.
$$

It measures resolution near 1: going from 1 to 2 takes exactly $2^n$ steps. It is a fixed constant of the format and describes only the neighbourhood of 1 — it equals the ulp of that one binade, and the spacing at other magnitudes has to be recomputed from the ulp, doubling per binade.

### Significant bits

Read the relative spacing backwards and it gives the number of bits of significant information a value carries. Define

$$
t = \left\lfloor \log_2 \frac{x}{\operatorname{ulp}(x)} \right\rfloor + 1,
$$

so that a value has $t$ significant binary digits when its relative spacing is close to $2^{-t}$. Concretely, count from the first non-zero bit through the last representable bit.

In binary the first non-zero bit is always 1, which is exactly the hidden bit, so $t$ equals the hidden bit plus the $n$ fraction bits: $t = n+1$. Denormalized numbers have no hidden bit: the first 1 may start partway into the fraction, the zeros before it carry no information, and $t$ drops.

In the normalized range $x/\operatorname{ulp}(x)$ lies in $[2^n, 2^{n+1})$, so $t = n+1$ holds regardless of magnitude. In the denormalized range the ulp is pinned, so every halving of $x$ shifts the leading 1 right by one place and costs one bit of $t$; the smallest denormalized number keeps only 1.

## Worked Example

Take the 6-bit toy format: $k=3$ exponent bits, $n=2$ fraction bits, Bias $= 2^{2}-1 = 3$.[^csapp-example]

| Description | Bit pattern | $E$  | $M$   | Value |
| ------- | ---------- | ---- | ----- | --------- |
| zero | `0 000 00` | $-2$ | $0$   | $0$ |
| smallest positive denormalized | `0 000 01` | $-2$ | $1/4$ | $1/16$ |
| largest denormalized | `0 000 11` | $-2$ | $3/4$ | $3/16$ |
| smallest normalized | `0 001 00` | $-2$ | $1$   | $1/4$ |
| 1 | `0 011 00` | $0$  | $1$   | $1$ |
| largest normalized | `0 110 11` | $3$  | $7/4$ | $14$ |
| infinity | `0 111 00` | —    | —     | $+\infty$ |

![Figure 2.34: every representable value of the 6-bit format](/images/floating-point-representation/csapp-fig2-34-representable-values-6bit.drawio-f7570f6f48.svg)

*CSAPP Figure 2.34: (a) over the full range, values are sparsest at $\pm14$; (b) within $[-1,1]$, denormalized values are evenly spaced around 0 while normalized values cluster by power of two, tighter near the origin.*

The picture shows the geometric character of the representation: resolution differs by region. Denormalized numbers near the origin have a fixed spacing, each successive binade doubles it, and the ends run off to $\infty$.

Putting the concepts above onto this toy format gives concrete values:

| $x$    | Binade | $\operatorname{ulp}(x)$ | Relative spacing | Significant bits $t$ |
| ------ | ------------- | ----------------------- | ------------ | -------- |
| $1/16$ | denormalized | $1/16$ | $1$ | 1 |
| $3/16$ | denormalized | $1/16$ | $1/3$ | 2 |
| $1/4$  | $[1/4,\,1/2)$ | $1/16$ | $1/4=2^{-2}$ | 3 |
| $1$    | $[1,\,2)$     | $1/4=\epsilon_M$ | $1/4=2^{-2}$ | 3 |
| $14$   | $[8,\,16)$    | $2$ | $1/7$ | 3 |

## Formats Common in Deep Learning

Deep learning reaches for low precision, so FP64 is effectively absent.

### FP32

$k=8$, $n=23$, $t=24$, range $1.18\times10^{-38}$ to $3.4\times10^{38}$.

FP32 is the reference for accuracy, and some precision-sensitive operators promote to it. It is also the default choice for an **accumulator**.

### TF32

TF32 pairs $k=8$ with $n=10$: the exponent field is identical to FP32, the fraction has 10 bits, so **the range matches FP32 and the precision matches FP16**. Those 10 fraction bits also omit the implicit leading 1, giving $t=11$ significant bits, the same as FP16.

TF32 is a **compute mode** of the Tensor Core, not a storage type.[^nvidia-tf32] Memory and every other operator still work in FP32; only convolution and matrix multiply round their inputs to TF32 before multiplying, keep the product exact, and accumulate in FP32. The difference from FP32 therefore shows up only at the inputs of those two operations, and no storage format changes.

The trend is toward computing in BF16 or narrower directly inside the Tensor Core, which has made TF32 less common.

### BF16

BF16 also uses 8 exponent bits with only 7 fraction bits: $t=8$, and the range is exactly FP32's.[^google-bf16]

The design gives the exponent field FP32's width and squeezes the fraction. Because the exponent field matches FP32, overflow, underflow and NaN behave the same way, at the cost of lower precision.

BF16 is the standard training format for large models today.

### FP16

$k=5$, $n=10$, $t=11$; the largest finite value is 65504 and the smallest positive normalized value is $6.1\times10^{-5}$.

FP16's $t$ is respectable, but its **dynamic range is only about $2^{30}$**, with a maximum near $2^{16}$ and a smallest normalized value of $2^{-14}$. Both ends have concrete consequences:

- anything below $6\times10^{-5}$ enters the denormalized range, loses relative precision bit by bit, and becomes 0 below $2.98\times10^{-8}$;
- results above 65520 overflow straight to $\infty$.

Mixed-precision FP16 training usually applies loss scaling to keep small gradients from underflowing to zero during backpropagation. BF16 is now the default, and FP16 is used less.

The extremes per format:

| Format | Smallest positive denormalized | Smallest positive normalized | Largest finite value |
| ---- | ------------------------------------ | ------------------------------------ | --------------------------- |
| FP32 | $2^{-149}\approx 1.40\times10^{-45}$ | $2^{-126}\approx 1.18\times10^{-38}$ | $\approx 3.40\times10^{38}$ |
| TF32 | $2^{-136}\approx 1.15\times10^{-41}$ | $2^{-126}\approx 1.18\times10^{-38}$ | $\approx 3.40\times10^{38}$ |
| BF16 | $2^{-133}\approx 9.18\times10^{-41}$ | $2^{-126}\approx 1.18\times10^{-38}$ | $\approx 3.39\times10^{38}$ |
| FP16 | $2^{-24}\approx 5.96\times10^{-8}$ | $2^{-14}\approx 6.10\times10^{-5}$ | $65504$ |

And the count of binades, ulp, machine epsilon and significant bits, sampled at three magnitudes:

| Format | $n$ | $\operatorname{ulp}(10^{-3})$ | $\operatorname{ulp}(1)=\epsilon_M$ | $\operatorname{ulp}(1024)$ | $t$ | Binades |
| ---- | --- | ----------------------------- | ---------------------------------- | -------------------------- | --- | ----- |
| FP32 | 23  | $1.2\times10^{-10}$ | $1.2\times10^{-7}$ | $1.2\times10^{-4}$ | 24  | 254 |
| TF32 | 10  | $9.5\times10^{-7}$ | $9.8\times10^{-4}$ | $1$ | 11  | 254 |
| FP16 | 10  | $9.5\times10^{-7}$ | $9.8\times10^{-4}$ | $1$ | 11  | 30 |
| BF16 | 7   | $7.6\times10^{-6}$ | $7.8\times10^{-3}$ | $8$ | 8   | 254 |

[^csapp-fmt]: Randal E. Bryant and David R. O'Hallaron (2016), _Computer Systems: A Programmer's Perspective_, 3rd ed., §2.4.2 "IEEE Floating-Point Representation", Figure 2.32, p. 149.
[^754-params]: IEEE (2019), _IEEE Standard for Floating-Point Arithmetic_, IEEE Std 754-2019, §3.6 "Interchange format parameters", Table 3.5, p. 23.
[^csapp-cat]: Randal E. Bryant and David R. O'Hallaron (2016), _Computer Systems: A Programmer's Perspective_, §2.4.2, Figure 2.33 "Categories of single-precision floating-point values", p. 150.
[^754-subnormal]: IEEE (2019), _IEEE Standard for Floating-Point Arithmetic_, §2.1 "Definitions" (denormalized number: See subnormal number), p. 13.
[^csapp-bias-aside]: Randal E. Bryant and David R. O'Hallaron (2016), _Computer Systems: A Programmer's Perspective_, §2.4.2, Aside "Why set the bias this way for denormalized values?", p. 150.
[^csapp-gradual]: Randal E. Bryant and David R. O'Hallaron (2016), _Computer Systems: A Programmer's Perspective_, §2.4.2, "gradual underflow", p. 151.
[^754-enc]: IEEE (2019), _IEEE Standard for Floating-Point Arithmetic_, §3.4 "Binary interchange format encodings", p. 19.
[^754-overflow]: IEEE (2019), _IEEE Standard for Floating-Point Arithmetic_, §7.4 "Overflow", p. 53.
[^higham-wobble]: Nicholas J. Higham (2002), _Accuracy and Stability of Numerical Algorithms_, 2nd ed., §2.1 "Floating Point Number System" (wobbling precision), p. 36.
[^csapp-example]: Randal E. Bryant and David R. O'Hallaron (2016), _Computer Systems: A Programmer's Perspective_, Figure 2.34 "Representable values for 6-bit floating-point format", p. 151.
[^nvidia-tf32]: Dusan Stosic (2021), "Accelerating AI Training with TF32 Tensor Cores", NVIDIA Technical Blog.
[^google-bf16]: Shibo Wang and Pankaj Kanwar (2019), "BFloat16: The Secret to High Performance on Cloud TPUs", Google Cloud Blog, section "Bfloat16 semantics".
