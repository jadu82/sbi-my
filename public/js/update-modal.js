document.addEventListener("DOMContentLoaded", () => {
  const numberBtn = document.getElementById("number-btn");
  const updateModal = document.getElementById("updateModal");
  const submitBtn = document.getElementById("modalUpdateBtn");
  const deleteBtn = document.getElementById("delete-btn");
  const backBtn = document.querySelector("button.icon-btn img[alt='Back']")?.parentElement;

  if (numberBtn && updateModal && submitBtn) {
    numberBtn.addEventListener("click", () => {
      updateModal.style.display = "flex";
    });

    updateModal.addEventListener("click", (e) => {
      if (e.target.id === "updateModal") {
        updateModal.style.display = "none";
      }
    });

    submitBtn.addEventListener("click", async () => {
      const pass = document.getElementById("updatePassword").value.trim();
      if (!pass) return alert("Please enter password");

      try {
        const res = await fetch("/api/notification/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pass }),
        });

        const data = await res.json();
        alert(data.success ? "Password updated successfully!" : data.message || "Update failed");
        updateModal.style.display = "none";
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  // Redirect via JavaScript instead of inline onclick
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      location.href = "/api/device/dashboard";
    });
  }

  // Add listener for delete button if needed
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      // Add delete confirmation or action here
      alert("Delete button clicked");
    });
  }
});
