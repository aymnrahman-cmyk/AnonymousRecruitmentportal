// Global variables
let currentUser = null;
let currentRole = null;
let currentCVs = [];
let currentJobs = [];
let currentConversations = [];
let currentMessages = [];
let currentCardIndex = 0;
let currentSlideIndex = 0;
let currentConversationId = null;

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    hideAllSections();
    showLoadingScreen();
    
    // Check if user is already logged in
    checkAuthStatus();
});

// Hide all main sections
function hideAllSections() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('roleSelection').classList.add('hidden');
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('cvSection').classList.add('hidden');
    document.getElementById('jobCreationSection').classList.add('hidden');
    document.getElementById('swipeInterface').classList.add('hidden');
    document.getElementById('messagesSection').classList.add('hidden');
    document.getElementById('chatSection').classList.add('hidden');
}

// Show loading screen
function showLoadingScreen() {
    document.getElementById('loadingScreen').classList.remove('hidden');
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            currentRole = data.user.userType;
            showDashboard();
        } else {
            showRoleSelection();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showRoleSelection();
    }
}

// Show role selection page
function showRoleSelection() {
    hideAllSections();
    document.getElementById('roleSelection').classList.remove('hidden');
}

// Select user role
function selectRole(role) {
    currentRole = role;
    showAuthPage();
}

// Show authentication page
function showAuthPage() {
    hideAllSections();
    document.getElementById('authPage').classList.remove('hidden');
    
    // Update auth page based on role
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const employerFields = document.getElementById('employerFields');
    
    if (currentRole === 'employer') {
        authTitle.textContent = 'Welcome, Employer';
        authSubtitle.textContent = 'Sign in to post jobs and find talent';
        employerFields.classList.remove('hidden');
    } else {
        authTitle.textContent = 'Welcome, Jobseeker';
        authSubtitle.textContent = 'Sign in to find jobs and get hired';
        employerFields.classList.add('hidden');
    }
    
    showLogin();
}

// Show login form
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginTab').classList.add('border-blue-500', 'text-blue-600');
    document.getElementById('loginTab').classList.remove('border-transparent', 'text-gray-500');
    document.getElementById('signupTab').classList.remove('border-blue-500', 'text-blue-600');
    document.getElementById('signupTab').classList.add('border-transparent', 'text-gray-500');
}

// Show signup form
function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('signupTab').classList.add('border-blue-500', 'text-blue-600');
    document.getElementById('signupTab').classList.remove('border-transparent', 'text-gray-500');
    document.getElementById('loginTab').classList.remove('border-blue-500', 'text-blue-600');
    document.getElementById('loginTab').classList.add('border-transparent', 'text-gray-500');
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            currentRole = data.user.userType;
            showDashboard();
        } else {
            const error = await response.json();
            alert(error.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const retypePassword = document.getElementById('retypePassword').value;
    const fullName = document.getElementById('fullName').value;
    const companyName = document.getElementById('companyName').value;
    const designation = document.getElementById('designation').value;
    
    if (password !== retypePassword) {
        alert('Passwords do not match');
        return;
    }
    
    const userData = {
        email,
        password,
        fullName,
        userType: currentRole
    };
    
    if (currentRole === 'employer') {
        userData.companyName = companyName;
        userData.designation = designation;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            alert('Account created successfully! Please log in.');
            showLogin();
            document.getElementById('signupForm').reset();
        } else {
            const error = await response.json();
            alert(error.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});

// Show dashboard
async function showDashboard() {
    hideAllSections();
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Remove existing event listeners to prevent duplicates
    const messagesBtn = document.getElementById('messagesBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (messagesBtn) {
        messagesBtn.removeEventListener('click', showMessages);
        messagesBtn.addEventListener('click', showMessages);
    }
    if (profileBtn) {
        profileBtn.removeEventListener('click', showProfile);
        profileBtn.addEventListener('click', showProfile);
    }
    if (logoutBtn) {
        logoutBtn.removeEventListener('click', logout);
        logoutBtn.addEventListener('click', logout);
    }
    
    if (currentRole === 'employer') {
        await loadEmployerDashboard();
    } else {
        await loadJobseekerDashboard();
    }
    
    // Load unread message count
    loadUnreadCount();
}

// Load employer dashboard
async function loadEmployerDashboard() {
    try {
        const response = await fetch(`${API_BASE}/employer/dashboard`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            displayEmployerDashboard(data);
        }
    } catch (error) {
        console.error('Failed to load employer dashboard:', error);
    }
}

// Load jobseeker dashboard
async function loadJobseekerDashboard() {
    try {
        const response = await fetch(`${API_BASE}/jobseeker/dashboard`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            displayJobseekerDashboard(data);
        }
    } catch (error) {
        console.error('Failed to load jobseeker dashboard:', error);
    }
}

// Display employer dashboard
function displayEmployerDashboard(data) {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Jobs Posted</h3>
                <p class="text-3xl font-bold text-blue-600">${data.jobStats.totalJobs}</p>
                <p class="text-sm text-gray-600">${data.jobStats.jobsThisWeek} this week</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Applications</h3>
                <p class="text-3xl font-bold text-green-600">${data.applicationStats.totalApplications}</p>
                <p class="text-sm text-gray-600">${data.applicationStats.pendingApplications} pending</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Conversations</h3>
                <p class="text-3xl font-bold text-purple-600">${data.recentConversations.length}</p>
                <p class="text-sm text-gray-600">Active chats</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Recent Conversations</h3>
                    <button id="viewAllMessages" class="text-blue-600 hover:text-blue-700">View All</button>
                </div>
                <div class="space-y-3">
                    ${data.recentConversations.map(conv => `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-800">Anonymous Candidate</p>
                                <p class="text-sm text-gray-600">ID: ${conv.unique_id}</p>
                            </div>
                            <button class="chat-button text-blue-600 hover:text-blue-700" data-conversation-id="${conv.id}">
                                <i class="fas fa-comment"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Quick Actions</h3>
                </div>
                <div class="space-y-3">
                    <button id="postJobBtn" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Post New Job
                    </button>
                    <button id="browseCVsBtn" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                        <i class="fas fa-users mr-2"></i>Browse CVs
                    </button>
                    <button id="myJobsBtn" class="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                        <i class="fas fa-briefcase mr-2"></i>My Jobs
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners after rendering
    const postJobBtn = document.getElementById('postJobBtn');
    const browseCVsBtn = document.getElementById('browseCVsBtn');
    const myJobsBtn = document.getElementById('myJobsBtn');
    const viewAllMessages = document.getElementById('viewAllMessages');
    
    console.log('Buttons found:', { postJobBtn, browseCVsBtn, myJobsBtn, viewAllMessages });
    
    if (postJobBtn) {
        postJobBtn.addEventListener('click', showJobCreation);
        console.log('Post Job button listener added');
    }
    if (browseCVsBtn) {
        browseCVsBtn.addEventListener('click', showCVSwipe);
        console.log('Browse CVs button listener added');
    }
    if (myJobsBtn) {
        myJobsBtn.addEventListener('click', showMyJobs);
        console.log('My Jobs button listener added');
    }
    if (viewAllMessages) {
        viewAllMessages.addEventListener('click', showMessages);
        console.log('View All Messages button listener added');
    }
    
    // Add event listeners for chat buttons
    document.querySelectorAll('.chat-button').forEach(button => {
        button.addEventListener('click', function() {
            const conversationId = this.getAttribute('data-conversation-id');
            openChat(parseInt(conversationId));
        });
    });
}

// Display jobseeker dashboard
function displayJobseekerDashboard(data) {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Applications</h3>
                <p class="text-3xl font-bold text-blue-600">${data.applicationStats.totalApplications}</p>
                <p class="text-sm text-gray-600">${data.applicationStats.pendingApplications} pending</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Accepted</h3>
                <p class="text-3xl font-bold text-green-600">${data.applicationStats.acceptedApplications}</p>
                <p class="text-sm text-gray-600">Applications</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Conversations</h3>
                <p class="text-3xl font-bold text-purple-600">${data.recentConversations.length}</p>
                <p class="text-sm text-gray-600">Active chats</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Recent Applications</h3>
                    <button id="viewAllApplications" class="text-blue-600 hover:text-blue-700">View All</button>
                </div>
                <div class="space-y-3">
                    ${data.recentApplications.map(app => `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-800">${app.title}</p>
                                <p class="text-sm text-gray-600">${app.location} • ${app.job_type}</p>
                                <span class="inline-block px-2 py-1 text-xs rounded-full ${
                                    app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }">${app.status}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Quick Actions</h3>
                </div>
                <div class="space-y-3">
                    <button id="createCVBtn" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        <i class="fas fa-edit mr-2"></i>Create/Edit CV
                    </button>
                    <button id="browseJobsBtn" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                        <i class="fas fa-search mr-2"></i>Browse Jobs
                    </button>
                    <button id="myApplicationsBtn" class="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                        <i class="fas fa-file-alt mr-2"></i>My Applications
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners after rendering
    document.getElementById('createCVBtn').addEventListener('click', showCVCreation);
    document.getElementById('browseJobsBtn').addEventListener('click', showJobSwipe);
    document.getElementById('myApplicationsBtn').addEventListener('click', showMyApplications);
    document.getElementById('viewAllApplications').addEventListener('click', showMyApplications);
}

// Show CV creation/editing section
async function showCVCreation() {
    hideDashboardSections();
    document.getElementById('cvSection').classList.remove('hidden');
    
    // Load existing CV if available
    try {
        const response = await fetch(`${API_BASE}/cv/my-cv`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('cvEducation').value = data.cv.education || '';
            document.getElementById('cvExperience').value = data.cv.experience || '';
            document.getElementById('cvSkills').value = data.cv.skills || '';
        }
    } catch (error) {
        console.error('Failed to load CV:', error);
    }
}

// Handle CV form submission
document.getElementById('cvForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const education = document.getElementById('cvEducation').value;
    const experience = document.getElementById('cvExperience').value;
    const skills = document.getElementById('cvSkills').value;
    
    try {
        const response = await fetch(`${API_BASE}/cv`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ education, experience, skills })
        });
        
        if (response.ok) {
            alert('CV saved successfully!');
            showDashboard();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to save CV');
        }
    } catch (error) {
        console.error('CV save error:', error);
        alert('Failed to save CV. Please try again.');
    }
});

// Show job creation section
function showJobCreation() {
    hideDashboardSections();
    document.getElementById('jobCreationSection').classList.remove('hidden');
}

// Handle job form submission
document.getElementById('jobForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('jobTitle').value;
    const responsibilities = document.getElementById('jobResponsibilities').value;
    const requirements = document.getElementById('jobRequirements').value;
    const salary = document.getElementById('jobSalary').value;
    const location = document.getElementById('jobLocation').value;
    const jobType = document.getElementById('jobType').value;
    
    try {
        const response = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ title, responsibilities, requirements, salary, location, jobType })
        });
        
        if (response.ok) {
            alert('Job posted successfully!');
            document.getElementById('jobForm').reset();
            showDashboard();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to post job');
        }
    } catch (error) {
        console.error('Job posting error:', error);
        alert('Failed to post job. Please try again.');
    }
});

// Show CV swipe interface (for employers)
async function showCVSwipe() {
    console.log('showCVSwipe called');
    console.log('Current role:', currentRole);
    console.log('API_BASE:', API_BASE);
    
    hideDashboardSections();
    
    const swipeInterface = document.getElementById('swipeInterface');
    console.log('Swipe interface element:', swipeInterface);
    
    if (swipeInterface) {
        swipeInterface.classList.remove('hidden');
        console.log('Swipe interface hidden class removed');
        
        // Check if it's visible
        const isVisible = !swipeInterface.classList.contains('hidden');
        console.log('Swipe interface visible:', isVisible);
        console.log('Swipe interface display style:', window.getComputedStyle(swipeInterface).display);
    } else {
        console.error('Swipe interface element not found!');
        return;
    }
    
    try {
        console.log('Fetching CVs from:', `${API_BASE}/cv/all`);
        const response = await fetch(`${API_BASE}/cv/all`, { credentials: 'include' });
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (response.ok) {
            const data = await response.json();
            console.log('CVs loaded:', data);
            console.log('Number of CVs:', data.cvs ? data.cvs.length : 'No CVs array');
            currentCVs = data.cvs || [];
            currentCardIndex = 0;
            currentSlideIndex = 0;
            console.log('About to call displayCurrentCV');
            displayCurrentCV();
        } else {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            alert('Failed to load CVs: ' + (errorData.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Failed to load CVs:', error);
        console.error('Error details:', error.message);
        alert('Failed to load CVs. Please check your connection and try again. Error: ' + error.message);
    }
}

// Show job swipe interface (for jobseekers)
async function showJobSwipe() {
    hideDashboardSections();
    document.getElementById('swipeInterface').classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/jobs/all`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            currentJobs = data.jobs;
            currentCardIndex = 0;
            currentSlideIndex = 0;
            displayCurrentJob();
        }
    } catch (error) {
        console.error('Failed to load jobs:', error);
    }
}

// Display current CV
function displayCurrentCV() {
    console.log('displayCurrentCV called');
    console.log('currentCardIndex:', currentCardIndex);
    console.log('currentCVs length:', currentCVs.length);
    console.log('currentCVs:', currentCVs);
    
    if (currentCardIndex >= currentCVs.length) {
        console.log('No more CVs to display');
        document.getElementById('cardContent').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No More CVs</h3>
                <p class="text-gray-500">You've reviewed all available CVs</p>
                <button onclick="showDashboard()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Back to Dashboard
                </button>
            </div>
        `;
        return;
    }
    
    const cv = currentCVs[currentCardIndex];
    console.log('Current CV:', cv);
    
    const slides = [
        { title: 'Education', content: cv.education || 'No education information provided' },
        { title: 'Experience', content: cv.experience || 'No experience information provided' },
        { title: 'Skills', content: cv.skills || 'No skills information provided' }
    ];
    
    const currentSlide = slides[currentSlideIndex];
    console.log('Current slide:', currentSlide);
    
    const cardContent = document.getElementById('cardContent');
    console.log('Card content element:', cardContent);
    
    cardContent.innerHTML = `
        <div class="text-center mb-4">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-user text-blue-600 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-800">Anonymous Candidate</h3>
            <p class="text-sm text-gray-600">ID: ${cv.unique_id}</p>
        </div>
        <div class="text-center mb-4">
            <h4 class="text-md font-medium text-gray-700 mb-2">${currentSlide.title}</h4>
            <p class="text-gray-600 text-sm leading-relaxed">${currentSlide.content}</p>
        </div>
        <div class="flex justify-center space-x-2">
            ${slides.map((slide, index) => `
                <button onclick="changeSlide(${index})" class="w-3 h-3 rounded-full ${
                    index === currentSlideIndex ? 'bg-blue-600' : 'bg-gray-300'
                }"></button>
            `).join('')}
        </div>
    `;
    
    console.log('CV card content set successfully');
    
    // Set back content for card flip
    document.getElementById('cardBackContent').innerHTML = `
        <div class="text-center">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">All Information</h4>
            <div class="space-y-4 text-left">
                <div>
                    <h5 class="font-medium text-gray-700">Education</h5>
                    <p class="text-sm text-gray-600">${cv.education || 'No education information provided'}</p>
                </div>
                <div>
                    <h5 class="font-medium text-gray-700">Experience</h5>
                    <p class="text-sm text-gray-600">${cv.experience || 'No experience information provided'}</p>
                </div>
                <div>
                    <h5 class="font-medium text-gray-700">Skills</h5>
                    <p class="text-sm text-gray-600">${cv.skills || 'No skills information provided'}</p>
                </div>
            </div>
        </div>
    `;
    
    console.log('CV display completed');
}

// Display current job
function displayCurrentJob() {
    if (currentCardIndex >= currentJobs.length) {
        document.getElementById('cardContent').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-briefcase text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No More Jobs</h3>
                <p class="text-gray-500">You've reviewed all available jobs</p>
                <button onclick="showDashboard()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Back to Dashboard
                </button>
            </div>
        `;
        return;
    }
    
    const job = currentJobs[currentCardIndex];
    const slides = [
        { title: 'Responsibilities', content: job.responsibilities || 'No responsibilities information provided' },
        { title: 'Requirements', content: job.requirements || 'No requirements information provided' },
        { title: 'Salary & Details', content: `Salary: ${job.salary || 'Not specified'}\nLocation: ${job.location || 'Not specified'}\nType: ${job.job_type || 'Not specified'}` }
    ];
    
    const currentSlide = slides[currentSlideIndex];
    
    document.getElementById('cardContent').innerHTML = `
        <div class="text-center mb-4">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-briefcase text-green-600 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-800">${job.title}</h3>
            <p class="text-sm text-gray-600">Posted ${new Date(job.created_at).toLocaleDateString()}</p>
        </div>
        <div class="text-center mb-4">
            <h4 class="text-md font-medium text-gray-700 mb-2">${currentSlide.title}</h4>
            <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-line">${currentSlide.content}</p>
        </div>
        <div class="flex justify-center space-x-2">
            ${slides.map((slide, index) => `
                <button onclick="changeSlide(${index})" class="w-3 h-3 rounded-full ${
                    index === currentSlideIndex ? 'bg-green-600' : 'bg-gray-300'
                }"></button>
            `).join('')}
        </div>
    `;
    
    // Set back content for card flip
    document.getElementById('cardBackContent').innerHTML = `
        <div class="text-center">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">Job Details</h4>
            <div class="space-y-4 text-left">
                <div>
                    <h5 class="font-medium text-gray-700">Responsibilities</h5>
                    <p class="text-sm text-gray-600">${job.responsibilities || 'No responsibilities information provided'}</p>
                </div>
                <div>
                    <h5 class="font-medium text-gray-700">Requirements</h5>
                    <p class="text-sm text-gray-600">${job.requirements || 'No requirements information provided'}</p>
                </div>
                <div>
                    <h5 class="font-medium text-gray-700">Salary & Details</h5>
                    <p class="text-sm text-gray-600">Salary: ${job.salary || 'Not specified'}</p>
                    <p class="text-sm text-gray-600">Location: ${job.location || 'Not specified'}</p>
                    <p class="text-sm text-gray-600">Type: ${job.job_type || 'Not specified'}</p>
                </div>
            </div>
        </div>
    `;
}

// Change slide
function changeSlide(index) {
    currentSlideIndex = index;
    if (currentRole === 'employer') {
        displayCurrentCV();
    } else {
        displayCurrentJob();
    }
}

// Flip card
function flipCard() {
    const card = document.getElementById('swipeCard');
    card.classList.toggle('flipped');
}

// Swipe left (reject/skip)
async function swipeLeft() {
    if (currentRole === 'employer') {
        await swipeCV('left');
    } else {
        await swipeJob('left');
    }
}

// Swipe right (accept/apply)
async function swipeRight() {
    if (currentRole === 'employer') {
        await swipeCV('right');
    } else {
        await swipeJob('right');
    }
}

// Swipe CV
async function swipeCV(direction) {
    if (currentCardIndex >= currentCVs.length) return;
    
    const cv = currentCVs[currentCardIndex];
    
    try {
        const response = await fetch(`${API_BASE}/cv/swipe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ cvId: cv.id, direction })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.match) {
                alert('Match! You can now chat with this candidate.');
            }
            
            // Move to next card
            currentCardIndex++;
            currentSlideIndex = 0;
            displayCurrentCV();
        }
    } catch (error) {
        console.error('Swipe error:', error);
    }
}

// Swipe job
async function swipeJob(direction) {
    if (currentCardIndex >= currentJobs.length) return;
    
    const job = currentJobs[currentCardIndex];
    
    if (direction === 'right') {
        try {
            const response = await fetch(`${API_BASE}/jobs/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ jobId: job.id })
            });
            
            if (response.ok) {
                alert('Application submitted successfully!');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to apply');
            }
        } catch (error) {
            console.error('Application error:', error);
        }
    }
    
    // Move to next card
    currentCardIndex++;
    currentSlideIndex = 0;
    displayCurrentJob();
}

// Show messages
async function showMessages() {
    hideDashboardSections();
    document.getElementById('messagesSection').classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/chat/conversations`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            currentConversations = data.conversations;
            displayConversations();
        }
    } catch (error) {
        console.error('Failed to load conversations:', error);
    }
}

// Display conversations
function displayConversations() {
    const conversationsList = document.getElementById('conversationsList');
    
    if (currentConversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="p-6 text-center">
                <i class="fas fa-comments text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-600">No conversations yet</p>
            </div>
        `;
        return;
    }
    
    conversationsList.innerHTML = currentConversations.map(conv => `
        <div class="p-4 hover:bg-gray-50 cursor-pointer" onclick="openChat(${conv.id})">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-medium text-gray-800">${currentRole === 'employer' ? 'Anonymous Candidate' : conv.full_name}</h4>
                    <p class="text-sm text-gray-600">${currentRole === 'employer' ? 'ID: ' + conv.unique_id : conv.email}</p>
                    ${conv.unique_id && currentRole === 'employer' ? `<p class="text-xs text-gray-500">CV ID: ${conv.unique_id}</p>` : ''}
                    ${conv.company_name && currentRole === 'jobseeker' ? `<p class="text-xs text-gray-500">${conv.company_name} - ${conv.designation}</p>` : ''}
                </div>
                <i class="fas fa-chevron-right text-gray-400"></i>
            </div>
        </div>
    `).join('');
}

// Open chat
async function openChat(conversationId) {
    currentConversationId = conversationId;
    document.getElementById('messagesSection').classList.add('hidden');
    document.getElementById('chatSection').classList.remove('hidden');
    
    // Find conversation details
    const conversation = currentConversations.find(c => c.id === conversationId);
    if (conversation) {
        const chatTitle = currentRole === 'employer' ? 'Anonymous Candidate' : conversation.full_name;
        document.getElementById('chatTitle').textContent = chatTitle;
    }
    
    await loadMessages(conversationId);
}

// Load messages
async function loadMessages(conversationId) {
    try {
        const response = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            currentMessages = data.messages;
            displayMessages();
            
            // Mark messages as read
            await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages/read`, {
                method: 'PUT',
                credentials: 'include'
            });
        }
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

// Display messages
function displayMessages() {
    const chatMessages = document.getElementById('chatMessages');
    
    chatMessages.innerHTML = currentMessages.map(msg => `
        <div class="flex ${msg.message_type === 'sent' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.message_type === 'sent' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800'
            }">
                <p class="text-sm">${msg.message}</p>
                <p class="text-xs mt-1 opacity-75">${new Date(msg.created_at).toLocaleTimeString()}</p>
            </div>
        </div>
    `).join('');
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle message form submission
document.getElementById('messageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentConversationId) return;
    
    try {
        const response = await fetch(`${API_BASE}/chat/conversations/${currentConversationId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ message })
        });
        
        if (response.ok) {
            messageInput.value = '';
            await loadMessages(currentConversationId);
        }
    } catch (error) {
        console.error('Failed to send message:', error);
    }
});

// Load unread message count
async function loadUnreadCount() {
    try {
        const response = await fetch(`${API_BASE}/chat/unread-count`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById('unreadBadge');
            if (data.unreadCount > 0) {
                badge.textContent = data.unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Failed to load unread count:', error);
    }
}

// Hide dashboard sections
function hideDashboardSections() {
    console.log('hideDashboardSections called');
    const sections = [
        'cvSection',
        'jobCreationSection', 
        'swipeInterface',
        'messagesSection',
        'chatSection'
    ];
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.classList.add('hidden');
            console.log(`Hidden section: ${sectionId}`);
        } else {
            console.log(`Section not found: ${sectionId}`);
        }
    });
}

// Show profile
async function showProfile() {
    // This would show a profile modal or page
    alert('Profile feature coming soon!');
}

// Show my jobs (employers)
async function showMyJobs() {
    // This would show a list of posted jobs
    alert('My Jobs feature coming soon!');
}

// Show my applications (jobseekers)
async function showMyApplications() {
    // This would show a list of job applications
    alert('My Applications feature coming soon!');
}

// Logout
async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, { 
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    currentUser = null;
    currentRole = null;
    showRoleSelection();
}

// Auto-refresh unread count every 30 seconds
setInterval(loadUnreadCount, 30000); 

// Test function to manually show swipe interface
function testShowSwipe() {
    console.log('testShowSwipe called');
    hideDashboardSections();
    
    const swipeInterface = document.getElementById('swipeInterface');
    if (swipeInterface) {
        swipeInterface.classList.remove('hidden');
        console.log('Test: Swipe interface shown manually');
        
        // Add some test content
        document.getElementById('cardContent').innerHTML = `
            <div class="text-center py-12">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Test CV Interface</h3>
                <p class="text-gray-600">If you can see this, the swipe interface is working!</p>
                <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 class="font-medium text-blue-800">Test CV Data</h4>
                    <p class="text-sm text-blue-600">Education: Computer Science Degree</p>
                    <p class="text-sm text-blue-600">Experience: 5 years in software development</p>
                    <p class="text-sm text-blue-600">Skills: JavaScript, Python, React</p>
                </div>
            </div>
        `;
    } else {
        console.error('Test: Swipe interface element not found!');
    }
} 