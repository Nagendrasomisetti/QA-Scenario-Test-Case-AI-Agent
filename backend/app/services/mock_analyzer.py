from app.models.schemas import (
    AnalysisResponse, Scenario, TestCase, PositiveCase, 
    NegativeCase, EdgeCase, Risk, MissingRequirement
)

class MockAnalyzerService:
    @staticmethod
    async def analyze_requirements(
        requirement: str, 
        has_pdf: bool = False, 
        has_image: bool = False
    ) -> AnalysisResponse:
        # Realistic mock data representing standard authentication/login flow if the input
        # is simple, or a general e-commerce dashboard if not specified.
        
        scenarios = [
            Scenario(
                id="SC-001",
                title="Successful Authentication",
                description="Verify that a registered user can successfully authenticate using valid credentials (email and password)."
            ),
            Scenario(
                id="SC-002",
                title="Failed Authentication & Account Lockout",
                description="Verify authentication behavior with invalid credentials, empty fields, and brute force protection lockout."
            ),
            Scenario(
                id="SC-003",
                title="Session Management & Persistence",
                description="Verify session persistence across tabs, automatic expiration, and logout behaviors."
            )
        ]
        
        test_cases = [
            TestCase(
                id="TC-001",
                scenario_id="SC-001",
                title="Standard Login with Valid Credentials",
                preconditions="User is registered with active credentials: test@example.com / Password123!",
                steps=[
                    "Navigate to the login page",
                    "Enter 'test@example.com' in the Email field",
                    "Enter 'Password123!' in the Password field",
                    "Click on the 'Login' button"
                ],
                expected_result="User is redirected to the dashboard, and a valid JWT token is stored in the HttpOnly cookie."
            ),
            TestCase(
                id="TC-002",
                scenario_id="SC-002",
                title="Brute Force Lockout Policy",
                preconditions="User account is currently unlocked.",
                steps=[
                    "Attempt to login with incorrect credentials 5 times consecutively",
                    "Attempt a 6th login with correct credentials"
                ],
                expected_result="On the 5th failed attempt, the account is temporarily locked. The 6th attempt displays a 'Locked out' message, and an unlock email is dispatched."
            )
        ]
        
        positive_cases = [
            PositiveCase(
                id="PC-001",
                title="Login Form Input Validation & Submission",
                steps=[
                    "Verify email input fields accept standards compliant email addresses.",
                    "Verify password fields conceal characters as they are typed."
                ],
                expected_result="Inputs accept valid format and hide characters securely."
            ),
            PositiveCase(
                id="PC-002",
                title="Remember Me Checkbox Persistence",
                steps=[
                    "Check 'Remember Me' during successful login.",
                    "Close the browser tab, open a new tab, and navigate to the site."
                ],
                expected_result="Session remains active; user bypasses the login screen."
            )
        ]
        
        negative_cases = [
            NegativeCase(
                id="NC-001",
                title="Login Attempt with Unregistered Email",
                steps=[
                    "Enter a non-existent email 'unknown_user@example.com'.",
                    "Enter any password and click login."
                ],
                expected_result="Show a generic error: 'Invalid email or password' to prevent user enumeration."
            ),
            NegativeCase(
                id="NC-002",
                title="SQL Injection inside Form Fields",
                steps=[
                    "Enter SQL payloads like ' OR 1=1 -- in the email field.",
                    "Click login."
                ],
                expected_result="Input is sanitized properly; standard validation error is shown."
            )
        ]
        
        edge_cases = [
            EdgeCase(
                id="EC-001",
                title="Login with trailing/leading whitespaces in Email",
                steps=[
                    "Enter '  test@example.com ' with spaces in the email field.",
                    "Enter correct password and click login."
                ],
                expected_result="System automatically trims whitespaces and logs the user in successfully."
            ),
            EdgeCase(
                id="EC-002",
                title="Simultaneous Logins on Multiple Devices",
                steps=[
                    "Log in on Device A with test account.",
                    "Log in on Device B with same test account.",
                    "Perform action on Device A."
                ],
                expected_result="Depending on policy, either both stay active, or Device A gets terminated with notification."
            )
        ]
        
        risks = [
            Risk(
                id="RK-001",
                description="Brute-force password guessing due to lack of rate limiting.",
                impact="High",
                mitigation="Implement IP rate limiting, account lockout policies, and CAPTCHA challenge after 3 failed attempts."
            ),
            Risk(
                id="RK-002",
                description="Session hijacking through cross-site scripting (XSS).",
                impact="High",
                mitigation="Store session tokens strictly in HttpOnly, Secure, and SameSite=Strict cookies."
            )
        ]
        
        missing_requirements = [
            MissingRequirement(
                id="MR-001",
                description="Password complexity requirements (length, special characters) are not specified.",
                impact="Medium"
            ),
            MissingRequirement(
                id="MR-002",
                description="Behavior for session timeout / inactivity threshold is not defined.",
                impact="Low"
            )
        ]
        
        return AnalysisResponse(
            scenarios=scenarios,
            test_cases=test_cases,
            positive_cases=positive_cases,
            negative_cases=negative_cases,
            edge_cases=edge_cases,
            risks=risks,
            missing_requirements=missing_requirements
        )
