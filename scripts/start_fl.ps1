Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-c", ".\.venv\Scripts\Activate.ps1; python backend/federated_learning/server.py"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-c", ".\.venv\Scripts\Activate.ps1; python hospitals/hospital_A/client.py"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-c", ".\.venv\Scripts\Activate.ps1; python hospitals/hospital_B/client.py"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-c", ".\.venv\Scripts\Activate.ps1; python hospitals/hospital_C/client.py"
