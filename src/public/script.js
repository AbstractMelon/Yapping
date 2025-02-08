let timelineChart = null;
let comparisonChart = null;
let staffCrewChart = null;

function openYapPopup() {
  document.getElementById("yap-popup").classList.remove("hidden");
}

function closeYapPopup() {
  document.getElementById("yap-popup").classList.add("hidden");
}

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("hidden");
  });
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  document.getElementById(`${sectionId}-section`).classList.remove("hidden");
  document
    .querySelector(`[onclick="showSection('${sectionId}')"]`)
    .classList.add("active");

  if (sectionId === "stats" || sectionId === "home") {
    loadStats();
  }
}

// Range input handlers
document.getElementById("staff-level").addEventListener("input", function (e) {
  document.getElementById("staff-value").textContent = e.target.value;
});

document.getElementById("crew-level").addEventListener("input", function (e) {
  document.getElementById("crew-value").textContent = e.target.value;
});

// Form submission
document
  .getElementById("yap-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = {
      ship: document.getElementById("ship").value,
      staffLevel: parseInt(document.getElementById("staff-level").value),
      crewLevel: parseInt(document.getElementById("crew-level").value),
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/yaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showSection("home");
        closeYapPopup();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit yap");
    }
  });

// Ship filter handlers
document.querySelectorAll(".ship-filter").forEach((button) => {
  button.addEventListener("click", function () {
    document
      .querySelectorAll(".ship-filter")
      .forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");
    updateCharts(this.dataset.ship);
  });
});

async function loadStats() {
  try {
    const response = await fetch("/api/yaps");
    const data = await response.json();
    const yaps = data.yaps;

    if (yaps.length === 0) {
      updateEmptyState();
      return;
    }

    const stats = calculateStats(yaps);
    updateDashboard(stats);
    updateCharts("all", yaps);
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

function calculateStats(yaps) {
  const stats = {
    byShip: {},
    overall: {
      totalYaps: yaps.length,
      peakYapping: 0,
      highestShip: "",
      highestAverage: 0,
      fleetAverage: 0,
    },
  };

  // Calculate per-ship statistics
  yaps.forEach((yap) => {
    if (!stats.byShip[yap.ship]) {
      stats.byShip[yap.ship] = {
        staffTotal: 0,
        crewTotal: 0,
        count: 0,
        timeline: [],
      };
    }

    const totalYapping = yap.staffLevel + yap.crewLevel;
    stats.overall.peakYapping = Math.max(
      stats.overall.peakYapping,
      totalYapping
    );

    stats.byShip[yap.ship].staffTotal += yap.staffLevel;
    stats.byShip[yap.ship].crewTotal += yap.crewLevel;
    stats.byShip[yap.ship].count++;
    stats.byShip[yap.ship].timeline.push({
      timestamp: yap.timestamp,
      totalYapping: totalYapping,
    });
  });

  // Calculate averages and find highest yapping ship
  let totalYapping = 0;
  Object.entries(stats.byShip).forEach(([ship, shipStats]) => {
    const average =
      (shipStats.staffTotal + shipStats.crewTotal) / (shipStats.count * 2);
    shipStats.average = average;
    totalYapping += shipStats.staffTotal + shipStats.crewTotal;

    if (average > stats.overall.highestAverage) {
      stats.overall.highestAverage = average;
      stats.overall.highestShip = ship;
    }
  });

  stats.overall.fleetAverage = totalYapping / (yaps.length * 2);

  return stats;
}

function updateDashboard(stats) {
  // // Update homepage summary
  // document.getElementById(
  //   "home-fleet-summary"
  // ).textContent = `${stats.overall.totalYaps} yaps recorded across the fleet`;
  // document.getElementById(
  //   "home-today-summary"
  // ).textContent = `Fleet average: ${stats.overall.fleetAverage.toFixed(1)}`;
  // document.getElementById(
  //   "home-peak-summary"
  // ).textContent = `Peak: ${stats.overall.peakYapping} (${stats.overall.highestShip})`;

  // Update stats page
  document.getElementById(
    "highest-yapping"
  ).textContent = `${stats.overall.highestShip}`;
  document.getElementById(
    "peak-yapping"
  ).textContent = `${stats.overall.peakYapping}`;
  document.getElementById(
    "total-yaps"
  ).textContent = `${stats.overall.totalYaps}`;
  document.getElementById(
    "avg-yapping"
  ).textContent = `${stats.overall.fleetAverage.toFixed(1)}`;
}

function updateCharts(selectedShip, yaps) {
  const darkTheme = {
    color: "#e0e6ff",
    grid: {
      color: "rgba(255, 255, 255, 0.1)",
    },
  };

  Chart.defaults.color = "#e0e6ff";
  Chart.defaults.borderColor = "rgba(255, 255, 255, 0.1)";

  // Timeline Chart
  const timelineData = prepareTimelineData(yaps, selectedShip);
  updateTimelineChart(timelineData);

  // Comparison Chart
  const comparisonData = prepareComparisonData(yaps);
  updateComparisonChart(comparisonData);

  // Staff vs Crew Chart
  const staffCrewData = prepareStaffCrewData(yaps, selectedShip);
  updateStaffCrewChart(staffCrewData);
}

function prepareTimelineData(yaps, selectedShip) {
  const filteredYaps =
    selectedShip === "all"
      ? yaps
      : yaps.filter((yap) => yap.ship === selectedShip);

  return {
    labels: filteredYaps.map((yap) =>
      moment(yap.timestamp).format("MMM D, HH:mm")
    ),
    datasets: [
      {
        label: "Total Yapping Level",
        data: filteredYaps.map((yap) => (yap.staffLevel + yap.crewLevel) / 2),
        borderColor: "#4f6eff",
        backgroundColor: "rgba(79, 110, 255, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };
}

function prepareComparisonData(yaps) {
  const shipStats = {};
  yaps.forEach((yap) => {
    if (!shipStats[yap.ship]) {
      shipStats[yap.ship] = {
        total: 0,
        count: 0,
      };
    }
    shipStats[yap.ship].total += yap.staffLevel + yap.crewLevel;
    shipStats[yap.ship].count++;
  });

  return {
    labels: Object.keys(shipStats),
    datasets: [
      {
        label: "Average Yapping Level",
        data: Object.values(shipStats).map(
          (stat) => stat.total / (stat.count * 2)
        ),
        backgroundColor: ["#4f6eff", "#2ec4ff", "#23d18b", "#ff4767"],
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    ],
  };
}

function prepareStaffCrewData(yaps, selectedShip) {
  const filteredYaps =
    selectedShip === "all"
      ? yaps
      : yaps.filter((yap) => yap.ship === selectedShip);

  const staffData = {};
  const crewData = {};

  filteredYaps.forEach((yap) => {
    if (!staffData[yap.ship]) {
      staffData[yap.ship] = { total: 0, count: 0 };
      crewData[yap.ship] = { total: 0, count: 0 };
    }
    staffData[yap.ship].total += yap.staffLevel;
    crewData[yap.ship].total += yap.crewLevel;
    staffData[yap.ship].count++;
    crewData[yap.ship].count++;
  });

  return {
    labels: Object.keys(staffData),
    datasets: [
      {
        label: "Staff",
        data: Object.values(staffData).map((data) => data.total / data.count),
        backgroundColor: "#4f6eff",
      },
      {
        label: "Crew",
        data: Object.values(crewData).map((data) => data.total / data.count),
        backgroundColor: "#2ec4ff",
      },
    ],
  };
}

function updateTimelineChart(data) {
  if (timelineChart) {
    timelineChart.destroy();
  }

  const ctx = document.getElementById("timeline-chart").getContext("2d");
  timelineChart = new Chart(ctx, {
    type: "line",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
        },
      },
    },
  });
}

function updateComparisonChart(data) {
  if (comparisonChart) {
    comparisonChart.destroy();
  }

  const ctx = document.getElementById("comparison-chart").getContext("2d");
  comparisonChart = new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
        },
      },
    },
  });
}

function updateStaffCrewChart(data) {
  if (staffCrewChart) {
    staffCrewChart.destroy();
  }

  const ctx = document.getElementById("staff-crew-chart").getContext("2d");
  staffCrewChart = new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
        },
      },
    },
  });
}

function updateEmptyState() {
  const emptyMessage = "No data available";
  document.getElementById("home-fleet-summary").textContent = emptyMessage;
  document.getElementById("home-today-summary").textContent = emptyMessage;
  document.getElementById("home-peak-summary").textContent = emptyMessage;
  document.getElementById("highest-yapping").textContent = "0";
  document.getElementById("peak-yapping").textContent = "0";
  document.getElementById("total-yaps").textContent = "0";
  document.getElementById("avg-yapping").textContent = "0";
}

// Initialize the application
showSection("home");
