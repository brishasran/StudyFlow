const addButton = document.querySelector(".primary-btn");
const modal = document.querySelector(".modal");
const closeButton = document.querySelector(".close-btn");
const saveButton = document.querySelector(".save-task-btn");

const taskName = document.querySelector("#taskName");
const taskType = document.querySelector("#taskType");
const taskDifficulty = document.querySelector("#taskDifficulty");
const taskDue = document.querySelector("#taskDue");

const columns = document.querySelectorAll(".column");
const todoColumn = columns[0];
const progressColumn = columns[1];
const doneColumn = columns[2];

const suggestionTitle = document.querySelector(".insight-card h2");
const suggestionText = document.querySelector(".insight-card p:last-child");
const scoreNumber = document.querySelector(".score-circle span");

const estimateRows = document.querySelectorAll(".estimate-row strong");
const estimateNote = document.querySelector(".note");

const resetButton = document.querySelector(".secondary-btn");
const bubble = document.querySelector(".bubble");
const resetText = document.querySelector(".reset-card p:nth-of-type(2)");

const statNumbers = document.querySelectorAll(".stat-card strong");
const calendarDays = document.querySelectorAll(".day");

let resetTimer = null;

addButton.addEventListener("click", function () {
  modal.classList.remove("hidden");
});

closeButton.addEventListener("click", function () {
  modal.classList.add("hidden");
});

saveButton.addEventListener("click", function () {
  if (taskName.value.trim() === "" || taskDue.value.trim() === "") {
    alert("Add a task name and due date first.");
    return;
  }

  const type = taskType.value;
  const difficulty = taskDifficulty.value;
  const estimate = getEstimate(type, difficulty);
  const score = getStressScore(type, difficulty);

  const task = document.createElement("article");
  task.classList.add("task");

  if (difficulty === "high") {
    task.classList.add("high");
  } else {
    task.classList.add("medium");
  }

  task.dataset.type = type;
  task.dataset.difficulty = difficulty;
  task.dataset.score = score;
  task.dataset.time = estimate.time;
  task.dataset.plan = estimate.plan;
  task.dataset.due = taskDue.value;

  task.innerHTML = `
    <span class="tag ${type}">${formatType(type)}</span>
    <h3>${taskName.value}</h3>
    <p>Suggested plan: ${estimate.plan}.</p>

    <div class="task-meta">
      <span>Due ${taskDue.value}</span>
      <span>Est. ${estimate.time}</span>
    </div>

    <div class="action-row">
      <button class="action-btn move-progress">In Progress</button>
      <button class="action-btn move-done">Done</button>
      <button class="action-btn delete">Delete</button>
    </div>
  `;

  task.addEventListener("click", function () {
    selectTask(task);
  });

  addTaskActions(task);

  todoColumn.appendChild(task);
  selectTask(task);

  modal.classList.add("hidden");
  taskName.value = "";
  taskDue.value = "";

  updateStats();
  updateCalendarLoad();
  updateSmartSuggestion();
});

document.querySelectorAll(".task").forEach(function (task) {
  task.dataset.type = getTaskTypeFromTag(task);
  task.dataset.difficulty = task.classList.contains("high") ? "high" : "medium";
  task.dataset.score = task.classList.contains("high") ? "92" : "68";
  task.dataset.time = task.querySelector(".task-meta span:last-child").textContent.replace("Est. ", "");
  task.dataset.plan = getEstimate(task.dataset.type, task.dataset.difficulty).plan;
  task.dataset.due = task.querySelector(".task-meta span:first-child").textContent
    .replace("Due ", "")
    .replace("Exam ", "")
    .replace("Completed", "");

  task.addEventListener("click", function () {
    selectTask(task);
  });

  addTaskActions(task);
});

calendarDays.forEach(function (day) {
  day.addEventListener("click", function () {
    const date = day.querySelector("span").textContent;
    showTasksForDay(date);
  });
});

function addTaskActions(task) {
  const progressButton = task.querySelector(".move-progress");
  const doneButton = task.querySelector(".move-done");
  const deleteButton = task.querySelector(".delete");

  if (progressButton) {
    progressButton.addEventListener("click", function (event) {
      event.stopPropagation();
      progressColumn.appendChild(task);
      task.classList.remove("done");
      updateStats();
      updateCalendarLoad();
      updateSmartSuggestion();
    });
  }

  if (doneButton) {
    doneButton.addEventListener("click", function (event) {
      event.stopPropagation();
      doneColumn.appendChild(task);
      task.classList.add("done");
      updateStats();
      updateCalendarLoad();
      updateSmartSuggestion();
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener("click", function (event) {
      event.stopPropagation();
      task.remove();
      updateStats();
      updateCalendarLoad();
      updateSmartSuggestion();
    });
  }
}

function selectTask(task) {
  document.querySelectorAll(".task").forEach(function (item) {
    item.classList.remove("selected-task");
  });

  task.classList.add("selected-task");

  const title = task.querySelector("h3").textContent;
  const type = task.dataset.type;
  const difficulty = task.dataset.difficulty;
  const score = task.dataset.score;
  const time = task.dataset.time;
  const plan = task.dataset.plan;

  suggestionTitle.textContent = "Viewing: " + title;
  suggestionText.textContent =
    "Task breakdown based on type, difficulty, estimated time, and workload.";

  scoreNumber.textContent = score;

  estimateRows[0].textContent = formatType(type);
  estimateRows[1].textContent = formatDifficulty(difficulty);
  estimateRows[2].textContent = plan;

  estimateNote.textContent =
    "Estimated time: " + time + ". StudyFlow uses this estimate to suggest a realistic study plan and priority level.";
}

function updateSmartSuggestion() {
  const tasks = document.querySelectorAll(".task:not(.done)");

  if (tasks.length === 0) return;

  let bestTask = null;
  let highestScore = -1;

  tasks.forEach(function (task) {
    const score = parseInt(task.dataset.score);

    if (score > highestScore) {
      highestScore = score;
      bestTask = task;
    }
  });

  if (bestTask) {
    const title = bestTask.querySelector("h3").textContent;

    suggestionTitle.textContent = "Start with " + title;
    suggestionText.textContent =
      "This task is prioritized based on workload, difficulty, and urgency.";

    scoreNumber.textContent = highestScore;
  }
}

function updateStats() {
  const tasks = document.querySelectorAll(".task");

  let dueThisWeek = 0;
  let highEffort = 0;
  let completed = 0;
  let overloadDays = 0;
  const dueCounts = {};

  tasks.forEach(function (task) {
    if (!task.classList.contains("done")) {
      dueThisWeek++;
    }

    if (task.dataset.difficulty === "high" && !task.classList.contains("done")) {
      highEffort++;
    }

    if (task.classList.contains("done")) {
      completed++;
    }

    if (!task.classList.contains("done") && task.dataset.due) {
      const day = extractDayNumber(task.dataset.due);

      if (day !== null) {
        if (!dueCounts[day]) {
          dueCounts[day] = 0;
        }

        dueCounts[day]++;
      }
    }
  });

  Object.keys(dueCounts).forEach(function (day) {
    if (dueCounts[day] >= 2) {
      overloadDays++;
    }
  });

  statNumbers[0].textContent = dueThisWeek;
  statNumbers[1].textContent = highEffort;
  statNumbers[2].textContent = completed;
  statNumbers[3].textContent = overloadDays;
}

function updateCalendarLoad() {
  calendarDays.forEach(function (day) {
    const date = day.querySelector("span").textContent;
    const count = countTasksForDay(date);

    day.classList.remove("calm", "busy", "heavy");

    if (count >= 2) {
      day.classList.add("heavy");
      day.querySelector("p").textContent = "😵‍💫 heavy";
    } else if (count === 1) {
      day.classList.add("busy");
      day.querySelector("p").textContent = "😐 busy";
    } else {
      day.classList.add("calm");
      day.querySelector("p").textContent = "😌 light";
    }
  });
}

function showTasksForDay(date) {
  const tasks = document.querySelectorAll(".task");
  const matches = [];

  tasks.forEach(function (task) {
    if (!task.classList.contains("done") && extractDayNumber(task.dataset.due) === date) {
      matches.push(task.querySelector("h3").textContent);
    }
  });

  if (matches.length === 0) {
    suggestionTitle.textContent = "Nothing due on Apr " + date;
    suggestionText.textContent = "This looks like a lighter day. Good time to get ahead or take a reset.";
    scoreNumber.textContent = "20";
  } else {
    suggestionTitle.textContent = "Due on Apr " + date;
    suggestionText.textContent = matches.join(" • ");
    scoreNumber.textContent = matches.length >= 2 ? "90" : "62";
  }
}

function countTasksForDay(date) {
  let count = 0;

  document.querySelectorAll(".task").forEach(function (task) {
    if (!task.classList.contains("done") && extractDayNumber(task.dataset.due) === date) {
      count++;
    }
  });

  return count;
}

function extractDayNumber(dateText) {
  if (!dateText) return null;

  const match = dateText.match(/\d+/);

  if (match) {
    return match[0];
  }

  return null;
}

function getTaskTypeFromTag(task) {
  const tag = task.querySelector(".tag");

  if (tag.classList.contains("assignment")) return "assignment";
  if (tag.classList.contains("quiz")) return "quiz";
  if (tag.classList.contains("midterm")) return "midterm";
  if (tag.classList.contains("lab")) return "lab";
  if (tag.classList.contains("final")) return "final";

  return "assignment";
}

function formatType(type) {
  if (type === "final") return "Final Prep";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDifficulty(difficulty) {
  if (difficulty === "high") return "Hard";
  if (difficulty === "medium") return "Medium";
  return "Light";
}

function getEstimate(type, difficulty) {
  if (type === "midterm" || type === "final") {
    if (difficulty === "high") return { time: "6 hrs", plan: "3 study sessions" };
    if (difficulty === "medium") return { time: "4 hrs", plan: "2 study sessions" };
    return { time: "2 hrs", plan: "1 review block" };
  }

  if (type === "assignment" || type === "lab") {
    if (difficulty === "high") return { time: "3 hrs", plan: "break into 2 work blocks" };
    if (difficulty === "medium") return { time: "2 hrs", plan: "1 focused work block" };
    return { time: "1 hr", plan: "quick completion block" };
  }

  if (type === "quiz") {
    if (difficulty === "high") return { time: "2 hrs", plan: "review notes + practice questions" };
    return { time: "1 hr", plan: "short review session" };
  }

  return { time: "1 hr", plan: "short study block" };
}

function getStressScore(type, difficulty) {
  let score = 40;

  if (type === "midterm" || type === "final") score += 30;
  if (type === "assignment" || type === "lab") score += 15;
  if (type === "quiz") score += 10;

  if (difficulty === "high") score += 20;
  if (difficulty === "medium") score += 10;

  return Math.min(score, 99);
}

resetButton.addEventListener("click", function () {
  if (resetTimer !== null) {
    clearInterval(resetTimer);
    resetTimer = null;
  }

  let timeLeft = 120;

  resetButton.textContent = "Reset in progress";
  resetButton.disabled = true;

  resetTimer = setInterval(function () {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    bubble.textContent = minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);

    if (timeLeft % 8 < 4) {
      resetText.textContent = "Inhale slowly.";
    } else {
      resetText.textContent = "Exhale slowly.";
    }

    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(resetTimer);
      resetTimer = null;

      bubble.textContent = "✦";
      resetText.textContent = "Reset complete. Choose one small next step.";
      resetButton.textContent = "Start reset";
      resetButton.disabled = false;
    }
  }, 1000);
});
function updateMonth() {
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const today = new Date();
  const monthTitle = document.getElementById("month-title");

  monthTitle.textContent = months[today.getMonth()];
}

updateMonth();

updateStats();
updateCalendarLoad();
updateSmartSuggestion();