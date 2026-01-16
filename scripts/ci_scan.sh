#!/bin/bash
echo "Starting scan..." > report.txt
npm run scan:all >> report.txt 2>&1
echo "Scan complete." >> report.txt
