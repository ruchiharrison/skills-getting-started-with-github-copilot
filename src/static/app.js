document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (DOM-built for safety/styling)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const title = document.createElement("strong");
        title.textContent = `Participants (${details.participants.length}):`;
        participantsDiv.appendChild(title);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant-item";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // Compute simple initials from localpart (before @) splitting on common separators
            const local = String(p).split("@")[0] || "";
            const parts = local.split(/[\._\-]/).filter(Boolean);
            let initials = (parts.length ? parts.map(s => s[0]).join("") : local.slice(0,2)).toUpperCase();
            initials = initials.slice(0,2);

            const badge = document.createElement("span");
            badge.className = "initials";
            badge.textContent = initials;

            const label = document.createElement("span");
            label.className = "participant-email";
            label.textContent = p;

              // Delete button to unregister participant
              const delBtn = document.createElement("button");
              delBtn.className = "participant-delete";
              delBtn.title = "Remove participant";
              delBtn.innerHTML = '&times;';

              // Click handler for deleting a participant
              delBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await unregisterParticipant(name, p);
              });

              li.appendChild(badge);
              li.appendChild(label);
              li.appendChild(delBtn);
              ul.appendChild(li);
          });
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly signed-up participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  
  // Unregister helper: calls backend to remove participant then refreshes list
  async function unregisterParticipant(activityName, email) {
    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const payload = await res.json();
      if (res.ok) {
        // refresh activities to show updated participants
        fetchActivities();
      } else {
        console.error("Failed to unregister:", payload);
        // optionally show a message to the user
        messageDiv.textContent = payload.detail || payload.message || "Failed to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      }
    } catch (err) {
      console.error("Error unregistering participant:", err);
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  }
});
