// Theme Switcher Functionality
document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("theme-toggle")
    const themeIconDark = document.getElementById("theme-icon-dark")
    const themeIconLight = document.getElementById("theme-icon-light")

    // Check for saved theme preference or use default
    const currentTheme = localStorage.getItem("theme") || "dark"

    // Apply the saved theme on page load
    if (currentTheme === "light") {
        document.documentElement.setAttribute("data-theme", "light")
        themeToggle.checked = true
        updateNavbarClass("light")
    } else {
        document.documentElement.setAttribute("data-theme", "dark")
        themeToggle.checked = false
        updateNavbarClass("dark")
    }

    // Toggle theme when the switch is clicked
    themeToggle.addEventListener("change", function () {
        if (this.checked) {
            document.documentElement.setAttribute("data-theme", "light")
            localStorage.setItem("theme", "light")
            updateNavbarClass("light")
        } else {
            document.documentElement.setAttribute("data-theme", "dark")
            localStorage.setItem("theme", "dark")
            updateNavbarClass("dark")
        }
    })

    // Function to update navbar class based on theme
    function updateNavbarClass(theme) {
        const navbar = document.querySelector(".navbar")
        if (theme === "light") {
            navbar.classList.remove("navbar-dark")
            navbar.classList.add("navbar-light")
        } else {
            navbar.classList.remove("navbar-light")
            navbar.classList.add("navbar-dark")
        }
    }
}) 