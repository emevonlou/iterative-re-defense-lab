# Iterative RE Defense Lab

Conceptual reverse engineering workflow simulator focused on senior-level defensive analysis and detection engineering.

This project provides a UI-based visualization of an iterative reverse engineering process, covering:

- Intake and triage
- Static analysis
- Dynamic analysis
- Unpacking and configuration extraction
- Detection engineering (YARA + behavioral logic)
- Reporting and lessons learned

All metrics displayed in the interface are simulated (demo values).  
No host telemetry is collected.


## Purpose

The goal of this project is to model the mental workflow of defensive reverse engineering in a structured and iterative way. It emphasizes:

- Hypothesis-driven analysis
- Evidence normalization
- Behavioral understanding over superficial indicators
- Translation of analysis into detections
- Clear, reproducible reporting

The interface is intentionally designed to reflect a senior-oriented analytical environment.


## Technical Stack

- HTML5
- CSS3 (custom layout and responsive design)
- Vanilla JavaScript (no external libraries)
- GitHub Pages for static deployment


## Live Demo

https://emevonlou.github.io/iterative-re-defense-lab/


## Local Execution

Clone the repository:

```bash
git clone https://github.com/emevonlou/iterative-re-defense-lab.git
cd iterative-re-defense-lab
```
- Open index.html in a browser:
```bash
xdg-open index.html
```
No build system or dependencies are required.

## Deployment

- The project is deployed via GitHub Pages using:

Branch: main
Folder: / (root)
All files are static and served directly.

## Notes

This project is a conceptual simulation.
No real system inspection or host-level data collection is performed.
All percentages and decision outputs are deterministic demo logic.





