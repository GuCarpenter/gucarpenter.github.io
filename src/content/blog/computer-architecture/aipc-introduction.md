---
title: AIPC Project Introduction
description: Building a dual-core CPU, TPU, and GPU on FPGA to learn computer architecture.
pubDate: 2026-01-18
tags:
  - project
  - risc-v
lang: "en"
---

Since my work involves Large Model Infrastructure, I inevitably face requirements for model optimization. While there is significant room for tuning at the framework level, all framework features ultimately rely on operator characteristics. Therefore, without a solid understanding of computer architecture, it feels impossible to thoroughly grasp these issues. To deepen my understanding of large model performance, I have decided to learn computer architecture hands-on this year by building an [AIPC project](https://github.com/GuCarpenter/GuAIPC) on an FPGA.

I spent a "fortune" on a second-hand Nexys4 DDR board from Xianyu. This FPGA, equipped with DRAM, is well-suited for demonstrating these concepts. I aim to implement a dual-core CPU, a small TPU, and a small GPU on it. If possible, I also plan to run a small operating system and a compact neural network. In the past, such a project would have been incredibly time-consuming, but now, with the aid of AI coding, it has become feasible.

This weekend, I implemented a single-cycle RISC-V processor that already supports most basic RISC-V instructions. It supports both Verilator simulation for verification and execution on the Nexys4 DDR. I will continue to iterate and update the project.

Stay tuned for more updates on this project.
