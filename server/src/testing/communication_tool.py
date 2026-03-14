"""
communication_tool.py
======================
The Planner's communication tool.
Sends coding tasks to GitHub Copilot via `copilot -p` CLI subprocess.

Flow:
    Planner → CommunicationTool.send(task)
                    ↓  subprocess
              copilot -p "instruction"
                    ↓
              GitHub Copilot Pro+
                    ↓
    Planner ← CopilotResponse ← result
"""

import subprocess
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("CommunicationTool")


# ──────────────────────────────────────────────
# Data models
# ──────────────────────────────────────────────

@dataclass
class PlannerTask:
    """
    A single coding task from the Planner.
    Sent to GitHub Copilot via the communication tool.
    """
    task_id: str
    instruction: str
    context: Optional[str] = None
    working_dir: str = "."
    timeout: int = 120
    model: str = "gpt-4o"

    def to_prompt(self) -> str:
        parts = [self.instruction]
        if self.context:
            parts.append(f"\nContext: {self.context}")
        return "\n".join(parts)


@dataclass
class CopilotResponse:
    """
    Result returned from GitHub Copilot after executing a task.
    Passed back to Planner → Manager → Reviewer.
    """
    task_id: str
    success: bool
    output: str
    error: Optional[str] = None
    premium_requests: str = ""
    api_time: str = ""
    model_used: str = ""

    def summary(self) -> str:
        status = "✅ SUCCESS" if self.success else "❌ FAILED"
        lines = [
            f"\n{status} | Task: {self.task_id}",
            f"Model: {self.model_used}  |  API time: {self.api_time}  |  Cost: {self.premium_requests}",
            f"{'─' * 50}",
            self.output,
        ]
        if self.error:
            lines.append(f"Error: {self.error}")
        return "\n".join(lines)


# ──────────────────────────────────────────────
# Communication Tool
# ──────────────────────────────────────────────

class CommunicationTool:
    """
    The Planner's tool to communicate with GitHub Copilot.
    Uses `copilot -p` CLI subprocess for each task.
    """

    def __init__(self, copilot_bin: str = "copilot"):
        self.copilot_bin = copilot_bin
        self._verify()

    def send(self, task: PlannerTask) -> CopilotResponse:
        """Send a single coding task to GitHub Copilot."""
        prompt = task.to_prompt()

        logger.info(f"[{task.task_id}] → Sending to Copilot")
        logger.info(f"[{task.task_id}] Instruction: {task.instruction[:100]}...")

        try:
            proc = subprocess.run(
                [self.copilot_bin, "-p", prompt],
                capture_output=True,
                text=True,
                timeout=task.timeout,
                cwd=task.working_dir,
            )

            raw = proc.stdout.strip()

            if proc.returncode != 0:
                return CopilotResponse(
                    task_id=task.task_id,
                    success=False,
                    output=raw,
                    error=proc.stderr.strip() or f"Exit code {proc.returncode}",
                )

            output, stats = self._parse(raw)

            logger.info(f"[{task.task_id}] ✅ Done — {stats.get('api_time', '')} | {stats.get('premium_requests', '')}")

            return CopilotResponse(
                task_id=task.task_id,
                success=True,
                output=output,
                premium_requests=stats.get("premium_requests", ""),
                api_time=stats.get("api_time", ""),
                model_used=stats.get("model", ""),
            )

        except subprocess.TimeoutExpired:
            return CopilotResponse(
                task_id=task.task_id,
                success=False,
                output="",
                error=f"Timed out after {task.timeout}s",
            )
        except FileNotFoundError:
            return CopilotResponse(
                task_id=task.task_id,
                success=False,
                output="",
                error="`copilot` CLI not found. Run: curl -fsSL https://gh.io/copilot-install | bash",
            )

    def send_batch(self, tasks: list[PlannerTask]) -> list[CopilotResponse]:
        """Send a full plan of tasks sequentially."""
        results = []
        print(f"\n{'='*60}")
        print(f"COMMUNICATION TOOL — Sending {len(tasks)} tasks to Copilot")
        print(f"{'='*60}")

        for i, task in enumerate(tasks, 1):
            print(f"\n[{i}/{len(tasks)}] Task: {task.task_id}")
            result = self.send(task)
            results.append(result)
            print(result.summary())

            if not result.success:
                logger.warning(f"[{task.task_id}] Failed — continuing to next task...")

        passed = sum(1 for r in results if r.success)
        print(f"\n{'='*60}")
        print(f"DONE: {passed}/{len(tasks)} tasks completed successfully")
        print(f"{'='*60}\n")

        return results

    # ── internals ─────────────────────────────

    def _parse(self, raw: str) -> tuple[str, dict]:
        """Split Copilot output into actual response and usage stats."""
        stats = {}
        lines = raw.splitlines()
        stat_start = None

        for i, line in enumerate(lines):
            if "Total usage est:" in line or "API time spent:" in line:
                stat_start = i
                break

        if stat_start is not None:
            output = "\n".join(lines[:stat_start]).strip()
            stat_block = "\n".join(lines[stat_start:])

            model_match = re.search(r"(gpt-[\w.]+|claude-[\w.]+|o\d[\w.]*)", stat_block)
            if model_match:
                stats["model"] = model_match.group(1)

            time_match = re.search(r"API time spent:\s+(\S+)", stat_block)
            if time_match:
                stats["api_time"] = time_match.group(1)

            premium_match = re.search(r"Total usage est:\s+(.+)", stat_block)
            if premium_match:
                stats["premium_requests"] = premium_match.group(1).strip()
        else:
            output = raw

        return output, stats

    def _verify(self):
        try:
            result = subprocess.run(
                [self.copilot_bin, "--version"],
                capture_output=True, text=True
            )
            version = result.stdout.strip().split("\n")[0]
            logger.info(f"Copilot CLI found → {version}")
        except FileNotFoundError:
            logger.warning("⚠️  `copilot` CLI not found!")


# ──────────────────────────────────────────────
# RUN — ask user for 3 inputs
# ──────────────────────────────────────────────

if __name__ == "__main__":

    print("\n" + "="*60)
    print("  COMMUNICATION TOOL — GitHub Copilot")
    print("="*60)

    # 1. Model name
    print("\nAvailable models: gpt-4o, gpt-4.1, gpt-5.4, claude-sonnet-4-5")
    model = input("Enter model name [default: gpt-4o]: ").strip()
    if not model:
        model = "gpt-4o"

    # 2. Task
    print("\nWhat do you want Copilot to do?")
    task_instruction = input("Enter your task: ").strip()
    if not task_instruction:
        print("❌ Task cannot be empty.")
        exit(1)

    # 3. Repo path
    print("\nEnter your repo path (e.g. ~/Desktop/projects/IntelliDoc)")
    repo_path = input("Repo path [default: current directory]: ").strip()
    if not repo_path:
        repo_path = "."

    print("\n" + "="*60)
    print(f"  Model   : {model}")
    print(f"  Task    : {task_instruction[:80]}...")
    print(f"  Repo    : {repo_path}")
    print("="*60)

    # Build and send
    tool = CommunicationTool()

    task = PlannerTask(
        task_id="task-001",
        instruction=task_instruction,
        working_dir=repo_path,
        model=model,
        timeout=120,
    )

    result = tool.send(task)
    print(result.summary())