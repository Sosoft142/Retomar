"""Exercise the recovery commands in an interactive Windows console, using fake credentials."""
import json
import queue
import re
import sys
import threading
import time
from winpty import PtyProcess

cwd, powershell, script = sys.argv[1:]
client_id = "12345-public.apps.googleusercontent.com"
client_secret = "fictitious_terminal_secret"
process = None
transcript = ""
stage = 0
error = ""
exit_status = None
answered_queries = 0
ansi = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]|\x1b\].*?(?:\x07|\x1b\\)", re.S)
try:
    process = PtyProcess.spawn([powershell, "-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script], cwd=cwd, dimensions=(40, 220))
    events = queue.Queue()

    def read_console():
        try:
            while True:
                events.put(process.read(8192))
        except EOFError:
            events.put(None)
        except Exception as failure:
            events.put(failure)

    threading.Thread(target=read_console, daemon=True).start()
    deadline = time.monotonic() + 90
    while True:
        if time.monotonic() > deadline:
            raise TimeoutError("Interactive PowerShell did not complete")
        try:
            chunk = events.get(timeout=0.2)
        except queue.Empty:
            continue
        if chunk is None:
            break
        if isinstance(chunk, Exception):
            raise chunk
        transcript += chunk
        queries = transcript.count("\x1b[6n")
        while answered_queries < queries:
            process.write("\x1b[1;1R")
            answered_queries += 1
        visible = ansi.sub("", transcript)
        if stage == 0 and "Cole o ID do cliente Google" in visible:
            process.write(client_id + "\r")
            stage = 1
        if stage == 1 and "Segredo desse cliente (entrada oculta)" in visible:
            process.write(client_secret + "\r")
            stage = 2
    exit_status = process.exitstatus
except Exception as failure:
    error = str(failure)
finally:
    if process is not None:
        process.close(force=True)
print("WINDOWS_CONSOLE_RESULT:" + json.dumps({"output": ansi.sub("", transcript), "stage": stage, "exitStatus": exit_status, "error": error}), flush=True)
sys.exit(1 if error or exit_status != 0 else 0)
