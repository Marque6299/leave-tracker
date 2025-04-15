document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements - Form
    const form = document.getElementById('leaveTrackerForm');
    const formMode = document.getElementById('formMode');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const editExistingBtn = document.getElementById('editExistingBtn');
    
    // DOM Elements - Form Fields
    const uidInput = document.getElementById('uid');
    const agentNameInput = document.getElementById('agentName');
    const supervisorInput = document.getElementById('supervisor');
    const leaveReasonInput = document.getElementById('leaveReason');
    const dateSelectionInput = document.getElementById('dateSelection');
    const weekCommencingInput = document.getElementById('weekCommencing');
    
    // DOM Elements - Calendar
    const calendarCard = document.getElementById('calendarCard');
    const calendarDays = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const currentMonthYearElem = document.getElementById('currentMonthYear');
    const calendarCloseBtn = document.getElementById('calendarClose');
    
    // DOM Elements - Selected Dates
    const selectedDatesText = document.getElementById('selectedDatesText');
    const formattedDatesText = document.getElementById('formattedDatesText');
    const dateSummary = document.getElementById('dateSummary');
    const clearDatesBtn = document.getElementById('clearDatesBtn');
    const dateSelectionError = document.getElementById('dateSelectionError');
    
    // DOM Elements - Modal
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    
    // DOM Elements - Retrieve Request Modal
    const retrieveRequestModal = new bootstrap.Modal(document.getElementById('retrieveRequestModal'));
    const retrieveRequestForm = document.getElementById('retrieveRequestForm');
    const retrieveRequestId = document.getElementById('retrieveRequestId');
    const requestList = document.getElementById('requestList');
    const requestListItems = document.getElementById('requestListItems');
    const retrieveRequestBtn = document.getElementById('retrieveRequestBtn');
    const retrieveError = document.getElementById('retrieveError');
    
    // DOM Elements - Success Modal
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    const successModalLabel = document.getElementById('successModalLabel');
    const successHeading = document.getElementById('successHeading');
    const successSubheading = document.getElementById('successSubheading');
    const successRequestId = document.getElementById('successRequestId');
    const successEmployeeId = document.getElementById('successEmployeeId');
    const successEmployeeName = document.getElementById('successEmployeeName');
    const successSupervisor = document.getElementById('successSupervisor');
    const successReason = document.getElementById('successReason');
    const successWeekCommencing = document.getElementById('successWeekCommencing');
    const successLeaveDates = document.getElementById('successLeaveDates');
    const successSubmissionTime = document.getElementById('successSubmissionTime');
    const successInfoText = document.getElementById('successInfoText');
    const successCopyDetailsBtn = document.getElementById('successCopyDetailsBtn');
    
    // Bootstrap Instances
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const notificationToast = new bootstrap.Toast(document.getElementById('notificationToast'));
    
    // Store selected dates and current view
    let selectedDates = [];
    let currentWeekStart = null;
    let currentWeekEnd = null;
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let lastSelectedDate = null; // For shift+click functionality
    
    // Mouse drag variables
    let isDragging = false;
    let dragStartDate = null;
    let dragCurrentDate = null;
    
    // State for key tracking
    let isCtrlPressed = false;
    let isShiftPressed = false;
    
    // Key event listeners
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Control' || e.key === 'Meta') isCtrlPressed = true;
      if (e.key === 'Shift') isShiftPressed = true;
    });
    
    document.addEventListener('keyup', function(e) {
      if (e.key === 'Control' || e.key === 'Meta') isCtrlPressed = false;
      if (e.key === 'Shift') isShiftPressed = false;
    });
    
    // Utility Functions
    
    // Generate Request ID based on UID and Week Commencing
    function generateRequestId(uid, weekCommencing) {
      // Ensure UID is 6 digits (pad with leading zeros if needed)
      const paddedUid = uid.toString().padStart(6, '0');
      
      // Convert weekCommencing (MM/DD/YYYY) to a numeric format (YYYYMMDD)
      const parts = weekCommencing.split('/');
      if (parts.length !== 3) return null;
      
      const month = parts[0];
      const day = parts[1];
      const year = parts[2];
      
      // Create a numeric date in format YYYYMMDD
      const numericDate = `${year}${month}${day}`;
      
      // Concatenate UID and numeric date
      return `${paddedUid}-${numericDate}`;
    }
    
    // Format date as MM/DD/YYYY
    function formatDate(date) {
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    }
    
    // Format date in a readable format (Month Day, Year)
    function formatReadableDate(date) {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    // Format date in a short format (Month Day)
    function formatShortDate(date) {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Format a date range
    function formatDateRange(startDate, endDate) {
      // If same year, don't repeat the year
      if (startDate.getFullYear() === endDate.getFullYear()) {
        // If same month, don't repeat the month
        if (startDate.getMonth() === endDate.getMonth()) {
          return `${formatShortDate(startDate)} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
        } else {
          return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}, ${endDate.getFullYear()}`;
        }
      } else {
        return `${formatReadableDate(startDate)} - ${formatReadableDate(endDate)}`;
      }
    }
    
    // Get Monday of the week for a given date
    function getMondayOfWeek(date) {
      const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
      const mondayDate = new Date(date);
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Handle Sunday as special case
      mondayDate.setDate(date.getDate() - daysToSubtract);
      return mondayDate;
    }
    
    // Get Sunday of the week for a given date
    function getSundayOfWeek(date) {
      const mondayDate = getMondayOfWeek(date);
      const sundayDate = new Date(mondayDate);
      sundayDate.setDate(mondayDate.getDate() + 6);
      return sundayDate;
    }
    
    // Check if a date is in the current week
    function isInCurrentWeek(date) {
      const today = new Date();
      const currentWeekMonday = getMondayOfWeek(today);
      const currentWeekSunday = getSundayOfWeek(today);
      
      return date >= currentWeekMonday && date <= currentWeekSunday;
    }
    
    // Check if a date is in the next week
    function isInNextWeek(date) {
      const today = new Date();
      const nextWeekMonday = new Date(getMondayOfWeek(today));
      nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);
      const nextWeekSunday = getSundayOfWeek(nextWeekMonday);
      
      return date >= nextWeekMonday && date <= nextWeekSunday;
    }
    
    // Check if date is restricted (in current or next week)
    function isDateRestricted(date) {
      return isInCurrentWeek(date) || isInNextWeek(date);
    }
    
    // Check if date is valid (in the future and within the current week if applicable)
    function isValidDate(date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if date is in the past
      if (date <= today) {
        return false;
      }
      
      // Check if date is in the current week or next week
      if (isDateRestricted(date)) {
        return false;
      }
      
      // If we have a current week set, check if date is within that week
      if (currentWeekStart && currentWeekEnd) {
        return date >= currentWeekStart && date <= currentWeekEnd;
      }
      
      return true;
    }
    
    // Check if two dates are the same day
    function isSameDay(date1, date2) {
      return date1.getDate() === date2.getDate() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getFullYear() === date2.getFullYear();
    }
    
    // Check if a date exists in selectedDates array
    function dateExists(date) {
      return selectedDates.some(selectedDate => isSameDay(selectedDate, date));
    }
    
    // Get dates between two dates (inclusive)
    function getDatesBetween(startDate, endDate) {
      const dates = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    }
    
    // Show notification toast
    function showToast(title, message, type = 'info') {
      const toastElement = document.getElementById('notificationToast');
      const toastTitle = document.getElementById('toastTitle');
      const toastMessage = document.getElementById('toastMessage');
      const toastTime = document.getElementById('toastTime');
      
      // Remove existing classes
      toastElement.classList.remove('toast-success', 'toast-danger', 'toast-warning', 'toast-info');
      
      // Add appropriate class based on type
      toastElement.classList.add(`toast-${type}`);
      
      // Set content
      toastTitle.textContent = title;
      toastMessage.textContent = message;
      toastTime.textContent = 'Just now';
      
      // Show the toast
      notificationToast.show();
    }
    
    // Detect date ranges in the selected dates
    function detectDateRanges(dates) {
      if (dates.length === 0) return [];
      
      // Sort dates
      dates.sort((a, b) => a - b);
      
      const ranges = [];
      let rangeStart = dates[0];
      let rangeEnd = dates[0];
      
      for (let i = 1; i < dates.length; i++) {
        const currentDate = dates[i];
        const prevDate = dates[i-1];
        
        // Check if current date is consecutive with previous date
        const prevPlusOne = new Date(prevDate);
        prevPlusOne.setDate(prevPlusOne.getDate() + 1);
        
        if (currentDate.getTime() === prevPlusOne.getTime()) {
          // Extend the current range
          rangeEnd = currentDate;
        } else {
          // End the current range and start a new one
          if (rangeStart.getTime() === rangeEnd.getTime()) {
            // Single date
            ranges.push({ type: 'single', date: rangeStart });
          } else {
            // Date range
            ranges.push({ type: 'range', startDate: rangeStart, endDate: rangeEnd });
          }
          
          rangeStart = currentDate;
          rangeEnd = currentDate;
        }
      }
      
      // Add the last range
      if (rangeStart.getTime() === rangeEnd.getTime()) {
        ranges.push({ type: 'single', date: rangeStart });
      } else {
        ranges.push({ type: 'range', startDate: rangeStart, endDate: rangeEnd });
      }
      
      return ranges;
    }
    
    // Format date ranges for display
    function formatDateRanges(ranges) {
      return ranges.map(range => {
        if (range.type === 'single') {
          return formatReadableDate(range.date);
        } else {
          return formatDateRange(range.startDate, range.endDate);
        }
      }).join(', ');
    }
    
    // Update the display of selected dates
    function updateSelectedDatesList() {
      // Sort dates chronologically
      selectedDates.sort((a, b) => a - b);
      
      // Update the date selection input display
      if (selectedDates.length > 0) {
        const ranges = detectDateRanges(selectedDates);
        const formattedRanges = formatDateRanges(ranges);
        dateSelectionInput.value = formattedRanges;
        
        // Update the summary display
        let summaryText = `Your selection: ${formattedRanges}`;
        
        // Add count of total days
        if (selectedDates.length > 1) {
          summaryText += ` (${selectedDates.length} days total)`;
        }
        
        dateSummary.value = summaryText;
        
        // Update the hidden input with formatted dates
        formattedDatesText.value = formattedRanges;
      } else {
        dateSelectionInput.value = '';
        dateSummary.value = '';
        formattedDatesText.value = '';
      }
      
      // Update the hidden input with raw dates as text
      selectedDatesText.value = selectedDates.map(date => formatDate(date)).join(', ');
      
      // Update calendar UI to reflect selected dates
      renderCalendar(currentMonth, currentYear);
    }
    
    // Reset date selection
    function resetDateSelection() {
      // Check if we're in edit mode
      const isEditing = formMode.value === 'edit';
      
      // Clear selected dates
      selectedDates = [];
      
      // In edit mode, we want to keep the week boundaries
      if (!isEditing) {
        currentWeekStart = null;
        currentWeekEnd = null;
        weekCommencingInput.value = '';
      }
      
      lastSelectedDate = null;
      updateSelectedDatesList();
      
      // Hide error message if visible
      dateSelectionInput.classList.remove('is-invalid');
    }
    
    // Set the week boundaries based on a date
    function setWeekBoundaries(date) {
      currentWeekStart = getMondayOfWeek(date);
      currentWeekEnd = getSundayOfWeek(date);
      
      // Set the Week Commencing field
      weekCommencingInput.value = formatDate(currentWeekStart);
      
      // Update the calendar
      renderCalendar(currentMonth, currentYear);
    }
    
    // Handle adding a date
    function addDate(date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if date is in the past
      if (date <= today) {
        dateSelectionInput.classList.add('is-invalid');
        dateSelectionError.textContent = 'Please select a future date';
        return false;
      }
      
      // Check if date is in the current week or next week
      if (isDateRestricted(date)) {
        dateSelectionInput.classList.add('is-invalid');
        dateSelectionError.textContent = 'Cannot select dates in the current or next week';
        return false;
      }
      
      // If no dates selected yet, set week boundaries
      if (selectedDates.length === 0) {
        selectedDates.push(date);
        lastSelectedDate = date;
        setWeekBoundaries(date);
        dateSelectionInput.classList.remove('is-invalid');
        return true;
      }
      
      // Check if date is within the week boundaries
      if (date < currentWeekStart || date > currentWeekEnd) {
        dateSelectionInput.classList.add('is-invalid');
        dateSelectionError.textContent = 'Date must be within the same week as other selected dates';
        return false;
      }
      
      // Add date if not already selected
      if (!dateExists(date)) {
        selectedDates.push(date);
        lastSelectedDate = date;
        dateSelectionInput.classList.remove('is-invalid');
        return true;
      }
      
      return false;
    }
    
    // Handle removing a date
    function removeDate(date) {
      const index = selectedDates.findIndex(d => isSameDay(d, date));
      if (index !== -1) {
        selectedDates.splice(index, 1);
        
        // If all dates are removed, reset the week boundaries
        if (selectedDates.length === 0) {
          // Check if we're in edit mode
          const isEditing = formMode.value === 'edit';
          
          if (isEditing) {
            // In edit mode, preserve the week boundaries
            updateSelectedDatesList();
          } else {
            // In add mode, reset everything
            resetDateSelection();
          }
        }
        
        return true;
      }
      
      return false;
    }
    
    // Handle date selection with modifier keys
    function handleDateSelection(date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if date is in the past
      if (date <= today) {
        dateSelectionInput.classList.add('is-invalid');
        dateSelectionError.textContent = 'Please select a future date';
        return;
      }
      
      // Check if date is in the current week or next week
      if (isDateRestricted(date)) {
        dateSelectionInput.classList.add('is-invalid');
        dateSelectionError.textContent = 'Cannot select dates in the current or next week';
        return;
      }
      
      // If no dates selected yet, simply add this date and set week boundaries
      if (selectedDates.length === 0) {
        addDate(date);
        updateSelectedDatesList();
        return;
      }
      
      // Check if date is within the week boundaries
      if (date < currentWeekStart || date > currentWeekEnd) {
        dateSelectionInput.classList.add('is-invalid');
        dateSelectionError.textContent = 'Date must be within the same week as other selected dates';
        return;
      }
      
      // Handle Shift key for range selection
      if (isShiftPressed && lastSelectedDate) {
        // Get all dates between last selected and current
        let start, end;
        if (date < lastSelectedDate) {
          start = date;
          end = lastSelectedDate;
        } else {
          start = lastSelectedDate;
          end = date;
        }
        
        const datesBetween = getDatesBetween(start, end);
        
        // Filter invalid dates
        const validDates = datesBetween.filter(d => isValidDate(d));
        
        // Add all valid dates that aren't already selected
        validDates.forEach(d => {
          if (!dateExists(d)) {
            selectedDates.push(d);
          }
        });
        
        lastSelectedDate = date;
      } 
      // Handle Ctrl key for toggling individual dates
      else if (isCtrlPressed) {
        const index = selectedDates.findIndex(d => isSameDay(d, date));
        
        if (index !== -1) {
          // Remove date if already selected (toggle off)
          selectedDates.splice(index, 1);
        } else {
          // Add date if not already selected (toggle on)
          selectedDates.push(date);
        }
        
        lastSelectedDate = date;
      } 
      // Regular click - toggle the date without clearing previous selections
      else {
        const index = selectedDates.findIndex(d => isSameDay(d, date));
        
        if (index !== -1) {
          // Remove date if already selected (toggle off)
          selectedDates.splice(index, 1);
        } else {
          // Add date if not already selected (toggle on)
          selectedDates.push(date);
        }
        
        lastSelectedDate = date;
      }
      
      dateSelectionInput.classList.remove('is-invalid');
      updateSelectedDatesList();
    }
    
    // Handle drag selection
    function handleDragSelection(startDate, endDate) {
      if (!startDate || !endDate) return;
      
      // Ensure start date is before end date
      let start, end;
      if (startDate < endDate) {
        start = startDate;
        end = endDate;
      } else {
        start = endDate;
        end = startDate;
      }
      
      // Get all dates in the range
      const datesBetween = getDatesBetween(start, end);
      
      // Filter to only valid dates
      const validDates = datesBetween.filter(d => isValidDate(d));
      
      // If no valid dates, show error
      if (validDates.length === 0) {
        dateSelectionInput.classList.add('is-invalid');
        dateSelectionError.textContent = 'No valid dates in selected range';
        return;
      }
      
      // If using Ctrl or Shift, merge with existing selection
      if (isCtrlPressed || isShiftPressed) {
        // For each date in the range, toggle its selection
        validDates.forEach(date => {
          if (dateExists(date)) {
            removeDate(date);
          } else {
            addDate(date);
          }
        });
      } else {
        // Add all valid dates (don't clear previous selections)
        validDates.forEach(date => {
          if (!dateExists(date)) {
            addDate(date);
          }
        });
      }
      
      // Update the UI
      updateSelectedDatesList();
    }
    
    // Render the calendar for a specific month and year
    function renderCalendar(month, year) {
      // Clear the calendar
      calendarDays.innerHTML = '';
      
      // Set the current month and year in the header
      currentMonthYearElem.textContent = new Date(year, month, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      
      // Update the weekday headers with colors
      const weekdaysContainer = document.querySelector('.calendar-weekdays');
      if (weekdaysContainer) {
        weekdaysContainer.innerHTML = '';
        
        const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        weekdays.forEach((day, index) => {
          const dayElem = document.createElement('div');
          dayElem.textContent = day;
          
          // Add special styling for weekend days (index 5 = Saturday, 6 = Sunday)
          if (index >= 5) {
            dayElem.classList.add('weekend-day');
          }
          
          weekdaysContainer.appendChild(dayElem);
        });
      }
      
      // Get the first day of the month
      const firstDay = new Date(year, month, 1);
      
      // Calculate the day of week (0 = Sunday, 1 = Monday, etc.)
      // Convert to Monday-based week (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
      const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      
      // Get the number of days in the month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Get days from previous month
      const daysInPrevMonth = new Date(year, month, 0).getDate();
      
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get current and next week boundaries for disabling restricted dates
      const currentWeekMonday = getMondayOfWeek(today);
      const currentWeekSunday = getSundayOfWeek(today);
      const nextWeekMonday = new Date(currentWeekMonday);
      nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);
      const nextWeekSunday = new Date(currentWeekSunday);
      nextWeekSunday.setDate(nextWeekSunday.getDate() + 7);
      
      // Create a document fragment to improve rendering performance
      const fragment = document.createDocumentFragment();
      
      // Add days from previous month
      for (let i = startingDay - 1; i >= 0; i--) {
        const dayElem = document.createElement('div');
        dayElem.classList.add('calendar-day', 'other-month');
        dayElem.textContent = daysInPrevMonth - i;
        fragment.appendChild(dayElem);
      }
      
      // Add days of current month
      for (let i = 1; i <= daysInMonth; i++) {
        const dayElem = document.createElement('div');
        dayElem.classList.add('calendar-day');
        dayElem.textContent = i;
        
        // Add animation delay for staggered appearance
        dayElem.style.animationDelay = `${(i % 7) * 30}ms`;
        
        const date = new Date(year, month, i);
        dayElem.dataset.date = date.toISOString();
        
        // Add weekend class for Saturday and Sunday
        const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayElem.classList.add('weekend');
        }
        
        // Check if date is today
        if (date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()) {
          dayElem.classList.add('today');
        }
        
        // Check if date is selected
        if (selectedDates.some(selectedDate => isSameDay(selectedDate, date))) {
          dayElem.classList.add('selected');
        }
        
        // Check if week boundaries are set and the date is outside the current week
        if (currentWeekStart && currentWeekEnd && (date < currentWeekStart || date > currentWeekEnd)) {
          dayElem.classList.add('disabled');
        }
        
        // Check if date is past (disabled)
        if (date < today) {
          dayElem.classList.add('disabled');
        } 
        // Check if date is in the current week (also disabled)
        else if (date >= currentWeekMonday && date <= currentWeekSunday) {
          dayElem.classList.add('disabled');
          dayElem.title = "Cannot select dates in the current week";
        } 
        // Check if date is in the next week (also disabled)
        else if (date >= nextWeekMonday && date <= nextWeekSunday) {
          dayElem.classList.add('disabled');
          dayElem.title = "Cannot select dates in the next week";
        } 
        else {
          // Add click handler
          dayElem.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling which might close the calendar
            
            // Add ripple effect
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            this.appendChild(ripple);
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            ripple.classList.add('show');
            
            setTimeout(() => {
              ripple.remove();
            }, 500);
            
            handleDateSelection(date);
          });
          
          // Add mouse events for drag selection
          dayElem.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevent text selection during drag
            isDragging = true;
            dragStartDate = date;
          });
          
          dayElem.addEventListener('mouseover', function() {
            if (isDragging) {
              dragCurrentDate = date;
              
              // Highlight the range being dragged
              const calendarDayElems = document.querySelectorAll('.calendar-day:not(.other-month):not(.disabled)');
              
              calendarDayElems.forEach(day => {
                const dayDate = day.dataset.date ? new Date(day.dataset.date) : null;
                if (!dayDate) return;
                
                day.classList.remove('drag-hover');
                
                if (dragStartDate && dragCurrentDate) {
                  const minDate = dragStartDate < dragCurrentDate ? dragStartDate : dragCurrentDate;
                  const maxDate = dragStartDate > dragCurrentDate ? dragStartDate : dragCurrentDate;
                  
                  if (dayDate >= minDate && dayDate <= maxDate) {
                    day.classList.add('drag-hover');
                  }
                }
              });
            }
          });
        }
        
        fragment.appendChild(dayElem);
      }
      
      // Add days from next month to fill out the grid
      const totalDaysAdded = startingDay + daysInMonth;
      const remainingCells = 7 - (totalDaysAdded % 7);
      
      if (remainingCells < 7) {
        for (let i = 1; i <= remainingCells; i++) {
          const dayElem = document.createElement('div');
          dayElem.classList.add('calendar-day', 'other-month');
          dayElem.textContent = i;
          fragment.appendChild(dayElem);
        }
      }
      
      // Add the fragment to the DOM in one operation
      calendarDays.appendChild(fragment);
      
      // Add animation class after a short delay
      setTimeout(() => {
        document.querySelectorAll('.calendar-day').forEach(day => {
          day.classList.add('animate-in');
        });
      }, 50);
    }
    
    // Function to position the calendar relative to the input
    function positionCalendar() {
      if (calendarCard.classList.contains('d-none')) return;
      
      const inputRect = dateSelectionInput.getBoundingClientRect();
      
      // Position the calendar
      calendarCard.style.position = 'fixed';
      calendarCard.style.top = (inputRect.bottom + window.scrollY - 15) + 'px';
      calendarCard.style.left = inputRect.left + 'px';
      calendarCard.style.width = Math.min(300, Math.max(inputRect.width, 250)) + 'px';
      
      // Ensure the calendar doesn't go off screen
      const calendarRect = calendarCard.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      if (calendarRect.right > viewportWidth) {
        const overflow = calendarRect.right - viewportWidth;
        calendarCard.style.left = (inputRect.left - overflow - 10) + 'px';
      }
    }
    
    // Event Listeners
    
    // Calendar date selection
    dateSelectionInput.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Make sure calendar is visible
      calendarCard.classList.remove('d-none');
      
      // Position the calendar
      positionCalendar();
    });
    
    // Calendar close button
    calendarCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      calendarCard.classList.add('d-none');
    });
    
    // Add keydown event to handle Enter key press
    dateSelectionInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !calendarCard.classList.contains('d-none')) {
        e.preventDefault();
        calendarCard.classList.add('d-none');
      }
    });
    
    // Hide calendar only when clicking outside
    document.addEventListener('click', function(e) {
      // Only close if click is outside the calendar and outside the input
      const clickedOutsideCalendar = !calendarCard.contains(e.target);
      const clickedOutsideInput = e.target !== dateSelectionInput;
      
      if (clickedOutsideCalendar && clickedOutsideInput) {
        calendarCard.classList.add('d-none');
      }
    });
    
    // Stop propagation on calendar clicks to prevent accidentally closing it
    calendarCard.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Previous month button
    prevMonthBtn.addEventListener('click', function() {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentMonth, currentYear);
      positionCalendar();
    });
    
    // Next month button
    nextMonthBtn.addEventListener('click', function() {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentMonth, currentYear);
      positionCalendar();
    });
    
    // Add event listener for clearing dates
    clearDatesBtn.addEventListener('click', function() {
      // Check if we're in edit mode
      const isEditing = formMode.value === 'edit';
      
      if (isEditing) {
        // In edit mode, just clear the selected dates but keep the week
        selectedDates = [];
        updateSelectedDatesList();
        showToast('Info', 'Dates cleared. You can select new dates within the same week.', 'info');
      } else {
        // In add mode, reset everything
        resetDateSelection();
      }
    });
    
    // Add mouseup event to end drag selection
    document.addEventListener('mouseup', function(e) {
      if (isDragging && dragStartDate && dragCurrentDate) {
        e.stopPropagation(); // Stop event propagation to prevent closing
        handleDragSelection(dragStartDate, dragCurrentDate);
        
        // Reset drag state
        isDragging = false;
        dragStartDate = null;
        dragCurrentDate = null;
        
        // Remove all hover highlights
        document.querySelectorAll('.calendar-day').forEach(dayElem => {
          dayElem.classList.remove('drag-hover');
        });
      } else {
        // Clean up any drag state even if not fully initiated
        isDragging = false;
        dragStartDate = null;
        dragCurrentDate = null;
      }
    });
    
    // Cancel button
    cancelBtn.addEventListener('click', function() {
      if (formMode.value === 'edit') {
        // Show confirmation modal
        document.getElementById('confirmationMessage').textContent = 'Are you sure you want to cancel editing this leave request?';
        
        // Set action for confirmation
        confirmActionBtn.dataset.action = 'cancel-edit';
        confirmationModal.show();
      } else {
        // Just reset the form for new requests
        resetForm();
      }
    });
    
    // Confirmation action handler
    confirmActionBtn.addEventListener('click', function() {
      const action = confirmActionBtn.dataset.action;
      
      if (action === 'cancel-edit') {
        resetForm();
        confirmationModal.hide();
        showToast('Cancelled', 'Editing has been cancelled', 'info');
      }
    });
    
    // Form submission
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Validate that we have at least one date
      if (selectedDates.length === 0) {
        dateSelectionInput.classList.add('is-invalid');
        dateSelectionError.textContent = 'Please select at least one date';
        return;
      }
      
      // Additional UID validation
      if (uidInput.value.length !== 6) {
        uidInput.classList.add('is-invalid');
        // Show validation message
        if (!document.getElementById('uid-error')) {
          const errorElement = document.createElement('div');
          errorElement.id = 'uid-error';
          errorElement.className = 'invalid-feedback';
          errorElement.textContent = 'Employee ID must be exactly 6 digits';
          uidInput.parentNode.appendChild(errorElement);
        }
        // Focus on the input
        uidInput.focus();
        return;
      }
      
      // Start submission process
      submitBtn.disabled = true;
      updateSubmitStatus('Preparing submission...');
      
      try {
        // Get key form values
        const uid = uidInput.value.trim();
        const weekCommencing = weekCommencingInput.value;
        
        // Determine if this is a new request or an update
        const isEditing = formMode.value === 'edit';
        let requestId;
        
        if (isEditing) {
          // Use the existing ID for updates
          requestId = form.dataset.editId;
          
          // Validate that we still have the ID
          if (!requestId) {
            throw new Error('Missing request ID for update');
          }
        } else {
          // Generate ID from UID and week commencing for new requests
          requestId = generateRequestId(uid, weekCommencing);
          
          // Validate the ID was generated successfully
          if (!requestId) {
            throw new Error('Failed to generate request ID. Please check date format.');
          }
        }
        
        updateSubmitStatus(`${isEditing ? 'Updating' : 'Submitting'} request...`);
        
        // Create data object with all the request details
        const payload = {
          id: requestId,
          uid: uid,
          agentName: agentNameInput.value,
          supervisor: supervisorInput.value,
          leaveReason: leaveReasonInput.value,
          requestDate: dateSelectionInput.value,
          weekCommencing: weekCommencing,
          submittedDate: new Date().toISOString()
        };
        
        // API endpoint and method based on operation
        const method = isEditing ? 'PUT' : 'POST';
        const endpoint = isEditing 
          ? `https://leave-tracker-api.jm-me6299.workers.dev/api/leave/${requestId}`
          : 'https://leave-tracker-api.jm-me6299.workers.dev/api/leave';
        
        // Submit to Cloudflare D1 via Worker API
        const response = await fetch(endpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          // Check if it's a duplicate entry error
          if (response.status === 409 || result.error?.includes('UNIQUE constraint failed') || result.error?.includes('duplicate')) {
            throw new Error('You already have a leave request for this week. Please edit your existing request instead.');
          }
          throw new Error(result.error || 'Failed to submit leave request');
        }
        
        updateSubmitStatus(`Successfully ${isEditing ? 'updated' : 'submitted'}!`);
        
        // Format dates for display
        const formattedSubmissionDate = new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
        
        // We're not using the returned result because it's minimal, 
        // instead we'll use the data we already have
        const submissionDetails = {
          id: requestId,
          employeeId: uid,
          agentName: agentNameInput.value,
          supervisor: supervisorInput.value,
          leaveReason: leaveReasonInput.value,
          weekCommencing: weekCommencing,
          requestDate: dateSelectionInput.value,
          submittedDate: formattedSubmissionDate
        };
        
        // Show success modal with request details
        showSuccessModal(submissionDetails, isEditing);
        
        // Reset the form
        resetForm();
      } catch (error) {
        console.error('Error submitting leave request:', error);
        updateSubmitStatus(`Submission failed: ${error.message}`, true);
        showToast('Error', error.message, 'danger');
        
        // Scroll to top to ensure the error message is visible
        window.scrollTo(0, 0);
      } finally {
        submitBtn.disabled = false;
      }
    });
    
    // Display the success modal with request details
    function showSuccessModal(details, isEditing = false) {
      // Update modal content based on action type
      successModalLabel.textContent = isEditing ? 'Leave Request Updated' : 'Leave Request Submitted';
      successHeading.textContent = isEditing ? 'Your leave request has been updated!' : 'Your leave request has been submitted!';
      successSubheading.textContent = isEditing ? 
        'Your request has been updated with the following details:' : 
        'Your request has been recorded with the following details:';
      
      // Populate details
      successRequestId.textContent = details.id;
      successEmployeeId.textContent = details.employeeId;
      successEmployeeName.textContent = details.agentName;
      successSupervisor.textContent = details.supervisor;
      successReason.textContent = details.leaveReason;
      successWeekCommencing.textContent = details.weekCommencing;
      successLeaveDates.textContent = details.requestDate;
      successSubmissionTime.textContent = details.submittedDate;
      
      // Set appropriate info message
      successInfoText.textContent = isEditing ? 
        'You can use your Request ID to make further edits if needed.' : 
        'Please save your Request ID for future reference if you need to edit this request.';
      
      // Show the modal
      successModal.show();
    }
    
    // Handle copy details button
    successCopyDetailsBtn.addEventListener('click', function() {
      // Format details for clipboard
      const details = 
        `Request ID: ${successRequestId.textContent}\n` +
        `Employee ID: ${successEmployeeId.textContent}\n` +
        `Employee Name: ${successEmployeeName.textContent}\n` +
        `Supervisor: ${successSupervisor.textContent}\n` +
        `Leave Reason: ${successReason.textContent}\n` +
        `Week Commencing: ${successWeekCommencing.textContent}\n` +
        `Leave Dates: ${successLeaveDates.textContent}\n` +
        `Submission Time: ${successSubmissionTime.textContent}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(details)
        .then(() => {
          // Update button text temporarily
          const originalText = successCopyDetailsBtn.innerHTML;
          successCopyDetailsBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
          successCopyDetailsBtn.classList.remove('btn-outline-secondary');
          successCopyDetailsBtn.classList.add('btn-outline-success');
          
          // Restore button text after 2 seconds
          setTimeout(() => {
            successCopyDetailsBtn.innerHTML = originalText;
            successCopyDetailsBtn.classList.remove('btn-outline-success');
            successCopyDetailsBtn.classList.add('btn-outline-secondary');
          }, 2000);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          showToast('Error', 'Failed to copy details to clipboard', 'danger');
        });
    });
    
    function updateSubmitStatus(message, isError = false) {
      const statusElement = document.getElementById('submitStatus');
      
      if (isError) {
        statusElement.classList.remove('text-muted', 'text-success');
        statusElement.classList.add('text-danger');
      } else {
        statusElement.classList.remove('text-muted', 'text-danger');
        statusElement.classList.add('text-success');
      }
      
      statusElement.textContent = message;
      
      // Clear status after 5 seconds
      setTimeout(() => {
        statusElement.classList.remove('text-success', 'text-danger');
        statusElement.classList.add('text-muted');
        statusElement.textContent = '';
      }, 5000);
    }
    
    // Reset form to initial state
    function resetForm() {
      // First set form mode to 'add' before resetting dates
      // This ensures week boundaries are fully reset
      formMode.value = 'add';
      
      // Now resetDateSelection will work in 'add' mode
      resetDateSelection();
      
      // Reset the form itself
      form.reset();
      
      // Remove any stored edit ID
      if (form.dataset.editId) {
        delete form.dataset.editId;
      }
      
      // Remove edit mode visual indicators
      const formCard = form.closest('.card');
      formCard.classList.remove('border-primary');
      
      // Remove edit mode indicator badge
      const editIndicator = document.getElementById('editModeIndicator');
      if (editIndicator) {
        editIndicator.remove();
      }
      
      // Reset cancel button style
      cancelBtn.classList.add('btn-outline-secondary');
      cancelBtn.classList.remove('btn-outline-danger');
      cancelBtn.innerHTML = '<i class="bi bi-x-circle me-1"></i>Cancel';
      
      // Enable UID field that may have been disabled in edit mode
      uidInput.removeAttribute('readonly');
      
      // Reset button text
      submitBtn.innerHTML = '<i class="bi bi-send me-1"></i>Submit Request';
      
      // Force redraw calendar with updated settings
      renderCalendar(currentMonth, currentYear);
    }
    
    // Initialize calendar
    function initCalendar() {
      renderCalendar(currentMonth, currentYear);
    }
    
    // Initialize application
    function initApp() {
      // Initialize calendar
      initCalendar();
      
      // Reset form
      resetForm();
    }
    
    // Start the application
    initApp();
    
    // Handle window resize
    window.addEventListener('resize', positionCalendar);
    
    // Open the retrieve request modal
    editExistingBtn.addEventListener('click', function() {
      resetRetrieveForm();
      retrieveRequestModal.show();
    });
    
    // Retrieve request by ID
    retrieveRequestBtn.addEventListener('click', async function() {
      const requestId = retrieveRequestId.value.trim();
      
      if (!requestId) {
        showRetrieveError('Please enter the Request ID');
        return;
      }
      
      try {
        retrieveRequestBtn.disabled = true;
        retrieveRequestBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Searching...';
        
        const response = await fetch(`https://leave-tracker-api.jm-me6299.workers.dev/api/leave/${requestId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to retrieve leave request');
        }
        
        if (!data.request) {
          throw new Error('Leave request not found');
        }
        
        // Calculate the date two weeks from now for validation
        const today = new Date();
        const twoWeeksFromNow = new Date(today);
        twoWeeksFromNow.setDate(today.getDate() + 14);
        twoWeeksFromNow.setHours(0, 0, 0, 0);
        
        // Parse weekCommencing date (format: MM/DD/YYYY)
        const weekCommencingDate = parseDate(data.request.weekCommencing);
        
        if (!weekCommencingDate) {
          throw new Error('Invalid week commencing date format in record');
        }
        
        // Check if the date is at least two weeks away
        if (weekCommencingDate < twoWeeksFromNow) {
          throw new Error('Cannot edit requests with week commencing date less than two weeks from today');
        }
        
        // Load the request for editing
        loadRequestForEditing(data.request);
        
      } catch (error) {
        console.error('Error retrieving leave request:', error);
        showRetrieveError(error.message);
      } finally {
        retrieveRequestBtn.disabled = false;
        retrieveRequestBtn.innerHTML = '<i class="bi bi-search me-1"></i>Find My Request';
      }
    });
    
    // Load a request for editing
    function loadRequestForEditing(request) {
      // Close the retrieve modal
      retrieveRequestModal.hide();
      
      // Set form to edit mode
      formMode.value = 'edit';
      
      // Add visual indicator that form is in edit mode
      const formCard = form.closest('.card');
      formCard.classList.add('border-primary');
      
      // Add edit mode indicator to the form header
      const cardHeader = formCard.querySelector('.card-header');
      const editIndicator = document.createElement('div');
      editIndicator.id = 'editModeIndicator';
      editIndicator.className = 'badge bg-primary ms-2';
      editIndicator.innerHTML = 'Edit Mode';
      
      // Only add if it doesn't already exist
      if (!document.getElementById('editModeIndicator')) {
        cardHeader.querySelector('.card-title').appendChild(editIndicator);
      }
      
      // Make cancel button more prominent
      cancelBtn.classList.remove('btn-outline-secondary');
      cancelBtn.classList.add('btn-outline-danger');
      cancelBtn.innerHTML = '<i class="bi bi-x-circle me-1"></i>Cancel Edit';
      
      // Populate the form fields
      uidInput.value = request.uid;
      agentNameInput.value = request.agentName;
      supervisorInput.value = request.supervisor;
      leaveReasonInput.value = request.leaveReason;
      dateSelectionInput.value = request.requestDate;
      weekCommencingInput.value = request.weekCommencing;
      
      // Store the original request ID for updating
      form.dataset.editId = request.id;
      
      // Disable UID field since it's part of the composite key
      uidInput.setAttribute('readonly', 'readonly');
      
      // Update submit button text
      submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Update Request';
      
      // Show toast notification
      showToast('Edit Mode', 'You are now editing an existing leave request', 'info');
      
      // Reset selected dates
      selectedDates = [];
      
      // Set calendar view to the week in the request
      const weekCommencing = parseDate(request.weekCommencing);
      if (weekCommencing) {
        setWeekBoundaries(weekCommencing);
        currentMonth = weekCommencing.getMonth();
        currentYear = weekCommencing.getFullYear();
      } else {
        console.error('Could not parse week commencing date:', request.weekCommencing);
        showToast('Warning', 'Could not set calendar to correct week', 'warning');
      }
      
      // Try to select the dates based on the requestDate
      if (!request.requestDate) {
        console.error('No request date provided');
        renderCalendar(currentMonth, currentYear);
        return;
      }
      
      try {
        console.log('Parsing date ranges from:', request.requestDate);
        const dateRangeText = request.requestDate;
        
        // Split by commas, but not commas inside a date range
        const dateRanges = splitDateRanges(dateRangeText);
        console.log('Found date ranges:', dateRanges);
        
        let successfullyParsedDates = 0;
        
        // Empty the selectedDates array before adding dates
        selectedDates = [];
        
        dateRanges.forEach(range => {
          try {
            // Handle date range like "April 29 - 30, 2025" or "April 29 - May 1, 2025"
            if (range.includes(' - ')) {
              const [startPart, endPart] = splitDateRange(range);
              console.log('Split range:', startPart, 'to', endPart);
              
              // Parse start date (complete date string)
              const startDate = new Date(startPart);
              
              // Parse end date which might be missing month/year
              let endDate;
              
              // Case: "April 29 - 30, 2025" (month and year from start)
              if (!endPart.includes(',') && !containsMonth(endPart)) {
                // Just a day number or "day, year"
                if (endPart.includes(',')) {
                  const parts = endPart.split(',');
                  const day = parseInt(parts[0].trim());
                  const year = parseInt(parts[1].trim());
                  endDate = new Date(year, startDate.getMonth(), day);
                } else {
                  const day = parseInt(endPart.trim());
                  endDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
                }
              } else {
                // Complete date
                endDate = new Date(endPart);
              }
              
              // If valid dates, add all dates in range
              if (!isNaN(startDate) && !isNaN(endDate)) {
                console.log('Adding date range:', startDate, 'to', endDate);
                const dates = getDatesBetween(startDate, endDate);
                selectedDates = [...selectedDates, ...dates];
                successfullyParsedDates += dates.length;
              } else {
                console.error('Invalid date range:', startPart, 'to', endPart);
              }
            } else {
              // Handle single date
              const date = new Date(range);
              if (!isNaN(date)) {
                console.log('Adding single date:', date);
                selectedDates.push(date);
                successfullyParsedDates++;
              } else {
                console.error('Invalid single date:', range);
              }
            }
          } catch (rangeError) {
            console.error('Error parsing range:', range, rangeError);
          }
        });
        
        // Update the calendar UI to reflect selected dates
        renderCalendar(currentMonth, currentYear);
        
        // Update the dates display
        updateSelectedDatesList();
        
        if (successfullyParsedDates === 0) {
          showToast('Warning', 'Could not restore any date selections', 'warning');
        } else if (successfullyParsedDates < dateRanges.length) {
          showToast('Info', 'Some dates may not have been restored correctly', 'info');
        }
      } catch (error) {
        console.error('Error parsing dates from request:', error);
        showToast('Warning', 'Could not restore date selections', 'warning');
      }
    }
    
    // Check if a string contains a month name
    function containsMonth(text) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                     'August', 'September', 'October', 'November', 'December'];
      return months.some(month => text.includes(month));
    }
    
    // Split date ranges by commas, but keep ranges together
    function splitDateRanges(text) {
      if (!text) return [];
      
      // For simple cases without dates spanning multiple months, we can use a regex
      if (!text.match(/[A-Z][a-z]+ \d+ - [A-Z][a-z]+/)) {
        return text.split(', ').map(s => s.trim());
      }
      
      // For more complex cases with proper month names
      const result = [];
      let currentSegment = '';
      let inRange = false;
      let rangeStarted = false;
      
      // Split the text by commas, but keeping ranges intact
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        currentSegment += char;
        
        // Detect range start
        if (char === '-' && 
            text[i-1] === ' ' && 
            text[i+1] === ' ' && 
            /\d/.test(text[i-2])) {
          inRange = true;
          rangeStarted = true;
        }
        
        // Detect end of entry (comma not in a range)
        if (char === ',' && !inRange) {
          result.push(currentSegment.slice(0, -1).trim()); // Remove the comma
          currentSegment = '';
        }
        
        // Detect range end - year pattern
        if (rangeStarted && 
            /\d{4}/.test(text.substring(i-3, i+1)) &&
            (i+1 === text.length || text[i+1] === ',' || text[i+1] === ' ')) {
          inRange = false;
          rangeStarted = false;
        }
      }
      
      // Add the last segment if there is one
      if (currentSegment) {
        result.push(currentSegment.trim());
      }
      
      return result;
    }
    
    // Split a date range into start and end parts
    function splitDateRange(range) {
      if (!range) return ['', ''];
      
      const dashIndex = range.indexOf(' - ');
      if (dashIndex === -1) return [range, ''];
      
      const startPart = range.substring(0, dashIndex).trim();
      const endPart = range.substring(dashIndex + 3).trim();
      
      return [startPart, endPart];
    }
    
    // Parse a display date like "January 15, 2023"
    function parseDisplayDate(dateString) {
      try {
        return new Date(dateString);
      } catch (e) {
        console.error('Error parsing display date:', e);
        return null;
      }
    }
    
    // Parse a date string in various formats (MM/DD/YYYY or ISO or display format)
    function parseDate(dateString) {
      if (!dateString) return null;
      
      try {
        // Try parsing MM/DD/YYYY format
        if (dateString.includes('/')) {
          const [month, day, year] = dateString.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        
        // Try parsing display format like "April 29, 2025"
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                       'August', 'September', 'October', 'November', 'December'];
        for (let i = 0; i < months.length; i++) {
          if (dateString.includes(months[i])) {
            return new Date(dateString);
          }
        }
        
        // Fallback to standard date parsing (ISO format)
        return new Date(dateString);
      } catch (e) {
        console.error('Error parsing date:', e);
        return null;
      }
    }
    
    // Reset the retrieve form
    function resetRetrieveForm() {
      retrieveRequestForm.reset();
      retrieveError.classList.add('d-none');
    }
    
    // Show an error in the retrieve form
    function showRetrieveError(message) {
      retrieveError.textContent = message;
      retrieveError.classList.remove('d-none');
    }
    
    // Add UID validation for exactly 6 digits
    uidInput.addEventListener('input', function() {
      // Remove non-digit characters
      this.value = this.value.replace(/\D/g, '');
      
      // Limit to 6 digits
      if (this.value.length > 6) {
        this.value = this.value.slice(0, 6);
      }
      
      // Add validation class
      if (this.value.length === 6) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
      } else {
        this.classList.remove('is-valid');
        if (this.value.length > 0) {
          this.classList.add('is-invalid');
        } else {
          this.classList.remove('is-invalid');
        }
      }
    });
    
    // Add validation on form submit for UID
    form.addEventListener('submit', function(e) {
      if (uidInput.value.length !== 6) {
        e.preventDefault();
        uidInput.classList.add('is-invalid');
        // Add a custom validation message
        if (!document.getElementById('uid-error')) {
          const errorElement = document.createElement('div');
          errorElement.id = 'uid-error';
          errorElement.className = 'invalid-feedback';
          errorElement.textContent = 'Employee ID must be exactly 6 digits';
          uidInput.parentNode.appendChild(errorElement);
        }
        return false;
      } else {
        const errorElement = document.getElementById('uid-error');
        if (errorElement) {
          errorElement.remove();
        }
      }
    }, true); // Use capture phase to run before other submit handlers
  }); 