# AWS Cognito Setup for IND3X Web3 App

## Prerequisites
1. AWS CLI configured with appropriate permissions
2. Node.js installed
3. AWS SDK for JavaScript

## Setup Instructions

### 1. Install AWS SDK
```bash
npm install aws-sdk
```

### 2. Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### 3. Create Cognito User Pool
```bash
node cognito-setup.js
```

This will create:
- A Cognito User Pool named "IND3X-UserPool"
- A User Pool Client for web authentication
- Output the UserPoolId and ClientId

### 4. Update Configuration
Copy the output from step 3 and update `app.js`:

```javascript
const COGNITO_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_XXXXXXXXX', // Replace with your User Pool ID
    clientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX' // Replace with your Client ID
};
```

## Features Implemented

### Authentication Flow
1. **Sign Up**: Users register with email/password
2. **Email Verification**: Confirmation code sent to email
3. **Sign In**: Authenticate with verified credentials
4. **Session Management**: Persistent login state
5. **Sign Out**: Secure logout

### Security Features
- Email verification required
- Password policies configurable
- Session token management
- Automatic session validation

### Error Handling
- Graceful fallback to demo mode
- Clear error messages
- Proper validation

## User Pool Configuration
- **Authentication**: Email + Password
- **Verification**: Email verification required
- **Password Policy**: Minimum 8 characters (configurable)
- **Auto-verified Attributes**: Email
- **Username Attributes**: Email

## Testing
1. Open the web app
2. Click "Sign up" 
3. Enter email and password
4. Check email for verification code
5. Enter code to confirm account
6. Sign in with credentials
7. Access Web3 features

## Production Considerations
- Enable MFA for additional security
- Configure custom email templates
- Set up proper IAM roles
- Monitor usage with CloudWatch
- Consider using Cognito Identity Pools for AWS resource access

## Troubleshooting
- Ensure AWS credentials have Cognito permissions
- Check email spam folder for verification codes
- Verify region consistency across configuration
- Check browser console for detailed error messages