@echo off
cd /d "e:\oando1408"
if not exist results mkdir results
gh auth status > results\repo-create.out 2>&1
echo. >> results\repo-create.out
echo === CREATE REPO === >> results\repo-create.out
gh repo create oando1408 --private --description "OO Studio / Planner" >> results\repo-create.out 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> results\repo-create.out
gh repo view ayushoando/oando1408 >> results\repo-create.out 2>&1
