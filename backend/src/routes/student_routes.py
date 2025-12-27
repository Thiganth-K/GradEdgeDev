"""Student API routes"""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
from werkzeug.security import generate_password_hash
import logging
import random
import time
import os
from ..mail.mail import send_otp_email

router = APIRouter(prefix='/api/student', tags=['student'])

logger = logging.getLogger(__name__)

# In-memory OTP store (username -> {otp, email, timestamp})
_otp_store = {}


class StudentUpdateRequest(BaseModel):
    """Request model for updating student profile"""
    full_name: Optional[str] = Field(None, min_length=1)
    email: Optional[str] = Field(None)
    mobile: Optional[str] = Field(None)
    department: Optional[str] = Field(None)


@router.get('/list/all')
async def list_all_students(request: Request):
    """List all students (for debugging)"""
    app = request.app
    try:
        if not hasattr(app, 'mongo_client') or app.mongo_client is None:
            return JSONResponse({'ok': False, 'error': 'Database not connected'}, status_code=500)
        
        db = app.mongo_client.gradedgedev
        students = db.students
        
        # Get all students (limit to 50 for safety)
        all_students = list(students.find({}, {'_id': 0, 'password': 0}).limit(50))
        
        return JSONResponse({
            'ok': True, 
            'count': len(all_students),
            'data': all_students
        }, status_code=200)
    
    except Exception as e:
        logger.error(f'Error listing students: {e}')
        return JSONResponse({'ok': False, 'error': str(e)}, status_code=500)


@router.post('/create-test-student')
async def create_test_student(request: Request):
    """Create a test student for development (for debugging)"""
    from werkzeug.security import generate_password_hash
    
    app = request.app
    try:
        if not hasattr(app, 'mongo_client') or app.mongo_client is None:
            return JSONResponse({'ok': False, 'error': 'Database not connected'}, status_code=500)
        
        db = app.mongo_client.gradedgedev
        students = db.students
        
        # Check if student already exists
        existing = students.find_one({'username': '23ITBE112'})
        if existing:
            return JSONResponse({'ok': False, 'error': 'Test student already exists'}, status_code=400)
        
        # Create test student
        test_student = {
            'username': '23ITBE112',
            'enrollment_id': '23ITBE112',
            'full_name': 'Test Student',
            'email': 'test.student@example.com',
            'mobile': '9876543210',
            'department': 'Computer Science',
            'institutional_id': 'test_inst_001',
            'faculty_id': None,
            'faculty_username': None,
            'role': 'student',
            'password': generate_password_hash('23ITBE112')
        }
        
        result = students.insert_one(test_student)
        test_student['_id'] = str(result.inserted_id)
        
        # Remove password from response
        test_student.pop('password', None)
        
        return JSONResponse({
            'ok': True,
            'message': 'Test student created successfully',
            'data': test_student
        }, status_code=201)
    
    except Exception as e:
        logger.error(f'Error creating test student: {e}')
        return JSONResponse({'ok': False, 'error': str(e)}, status_code=500)


@router.get('/{username}')
async def get_student_profile(username: str, request: Request):
    """Get student profile by username"""
    app = request.app
    try:
        if not hasattr(app, 'mongo_client') or app.mongo_client is None:
            return JSONResponse({'ok': False, 'error': 'Database not connected'}, status_code=500)
        
        db = app.mongo_client.gradedgedev
        students = db.students
        
        # Find student by username
        student = students.find_one({'username': username}, {'_id': 0, 'password': 0})
        
        if not student:
            return JSONResponse({'ok': False, 'error': 'Student not found'}, status_code=404)
        
        return JSONResponse({'ok': True, 'data': student}, status_code=200)
    
    except Exception as e:
        logger.error(f'Error fetching student profile: {e}')
        return JSONResponse({'ok': False, 'error': str(e)}, status_code=500)

@router.put('/{username}')
async def update_student_profile(username: str, request: Request):
    """Update student profile"""
    app = request.app
    try:
        if not hasattr(app, 'mongo_client') or app.mongo_client is None:
            return JSONResponse({'ok': False, 'error': 'Database not connected'}, status_code=500)
        
        # Get request body
        try:
            body = await request.json()
        except Exception:
            return JSONResponse({'ok': False, 'error': 'Invalid JSON body'}, status_code=400)
        
        db = app.mongo_client.gradedgedev
        students = db.students
        
        # Check if student exists
        student = students.find_one({'username': username})
        if not student:
            return JSONResponse({'ok': False, 'error': 'Student not found'}, status_code=404)
        
        # Build update document (only include provided fields)
        update_doc = {}
        if 'full_name' in body and body['full_name']:
            update_doc['full_name'] = body['full_name'].strip()
        if 'email' in body and body['email'] is not None:
            update_doc['email'] = body['email'].strip()
        if 'mobile' in body and body['mobile'] is not None:
            update_doc['mobile'] = body['mobile'].strip()
        if 'department' in body and body['department'] is not None:
            update_doc['department'] = body['department'].strip()
        
        if not update_doc:
            return JSONResponse({'ok': False, 'error': 'No fields to update'}, status_code=400)
        
        # Update student
        result = students.update_one(
            {'username': username},
            {'$set': update_doc}
        )
        
        if result.modified_count == 0:
            return JSONResponse({'ok': False, 'error': 'No changes made'}, status_code=400)
        
        # Return updated student
        updated_student = students.find_one({'username': username}, {'_id': 0, 'password': 0})
        return JSONResponse({'ok': True, 'data': updated_student}, status_code=200)
    
    except Exception as e:
        logger.error(f'Error updating student profile: {e}')
        return JSONResponse({'ok': False, 'error': str(e)}, status_code=500)


@router.post('/{username}/send-otp')
async def send_otp_for_credentials(username: str, request: Request):
    """Send OTP to student's email for credential changes"""
    app = request.app
    try:
        if not hasattr(app, 'mongo_client') or app.mongo_client is None:
            return JSONResponse({'ok': False, 'error': 'Database not connected'}, status_code=500)
        
        # Get request body
        try:
            body = await request.json()
            email = body.get('email')
        except Exception:
            return JSONResponse({'ok': False, 'error': 'Invalid JSON body'}, status_code=400)
        
        if not email:
            return JSONResponse({'ok': False, 'error': 'Email is required'}, status_code=400)
        
        db = app.mongo_client.gradedgedev
        students = db.students
        
        # Verify student exists
        student = students.find_one({'username': username})
        if not student:
            return JSONResponse({'ok': False, 'error': 'Student not found'}, status_code=404)
        
        # Generate 4-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        
        # Store OTP with timestamp (valid for 60 seconds)
        _otp_store[username] = {
            'otp': otp,
            'email': email,
            'timestamp': time.time(),
            'verified': False
        }
        
        # Send OTP via email
        try:
            otp_debug = os.environ.get('OTP_DEBUG', 'false').lower() in ('1', 'true', 'yes')
            
            send_otp_email(
                to_email=email,
                otp=otp,
                subject='GradEdgeDev - Verification Code',
                body=f'''Hello,

Your verification code for updating credentials is: {otp}

This code will expire in 1 minute.

If you didn't request this code, please ignore this email.

Best regards,
GradEdgeDev Team'''
            )
            
            logger.info(f'OTP sent successfully to {email}')
            if otp_debug:
                logger.info(f'DEBUG - OTP for {username}: {otp}')
        except Exception as e:
            logger.error(f'Failed to send OTP email: {e}')
            # Don't fail the request, OTP will be logged for development
            logger.info(f'Fallback - OTP for {username}: {otp}')
        
        return JSONResponse({
            'ok': True,
            'message': f'OTP sent to {email}'
        }, status_code=200)
    
    except Exception as e:
        logger.error(f'Error sending OTP: {e}')
        return JSONResponse({'ok': False, 'error': str(e)}, status_code=500)


@router.post('/{username}/verify-otp')
async def verify_otp(username: str, request: Request):
    """Verify OTP to enable credential editing"""
    app = request.app
    try:
        # Get request body
        try:
            body = await request.json()
            otp = body.get('otp')
        except Exception:
            return JSONResponse({'ok': False, 'error': 'Invalid JSON body'}, status_code=400)
        
        if not otp:
            return JSONResponse({'ok': False, 'error': 'OTP is required'}, status_code=400)
        
        # Verify OTP exists
        if username not in _otp_store:
            return JSONResponse({'ok': False, 'error': 'No OTP found. Please request a new one.'}, status_code=400)
        
        stored = _otp_store[username]
        
        # Check OTP expiration (60 seconds)
        if time.time() - stored['timestamp'] > 60:
            del _otp_store[username]
            return JSONResponse({'ok': False, 'error': 'OTP expired. Please request a new one.'}, status_code=400)
        
        # Verify OTP matches
        if stored['otp'] != otp:
            return JSONResponse({'ok': False, 'error': 'Invalid OTP'}, status_code=400)
        
        # Mark as verified (valid for 5 minutes after verification)
        _otp_store[username]['verified'] = True
        _otp_store[username]['verified_at'] = time.time()
        
        return JSONResponse({
            'ok': True,
            'message': 'OTP verified successfully'
        }, status_code=200)
    
    except Exception as e:
        logger.error(f'Error verifying OTP: {e}')
        return JSONResponse({'ok': False, 'error': str(e)}, status_code=500)


@router.put('/{username}/update-credentials')
async def update_credentials(username: str, request: Request):
    """Update student username/password after OTP verification"""
    app = request.app
    try:
        if not hasattr(app, 'mongo_client') or app.mongo_client is None:
            return JSONResponse({'ok': False, 'error': 'Database not connected'}, status_code=500)
        
        # Get request body
        try:
            body = await request.json()
            new_username = body.get('new_username')
            new_password = body.get('new_password')
        except Exception:
            return JSONResponse({'ok': False, 'error': 'Invalid JSON body'}, status_code=400)
        
        # Check if OTP was verified
        if username not in _otp_store:
            return JSONResponse({'ok': False, 'error': 'OTP verification required. Please request and verify OTP first.'}, status_code=400)
        
        stored = _otp_store[username]
        
        # Check if OTP was verified
        if not stored.get('verified'):
            return JSONResponse({'ok': False, 'error': 'Please verify OTP first'}, status_code=400)
        
        # Check if verification expired (5 minutes after verification)
        if time.time() - stored.get('verified_at', 0) > 300:
            del _otp_store[username]
            return JSONResponse({'ok': False, 'error': 'Verification expired. Please request a new OTP.'}, status_code=400)
        
        # OTP verified - proceed with update
        del _otp_store[username]
        
        db = app.mongo_client.gradedgedev
        students = db.students
        
        # Check if student exists
        student = students.find_one({'username': username})
        if not student:
            return JSONResponse({'ok': False, 'error': 'Student not found'}, status_code=404)
        
        # Store student email for notification
        student_email = student.get('email')
        student_full_name = student.get('full_name', username)
        
        update_doc = {}
        response_data = {}
        changed_username = None
        changed_password = None
        
        # Update username
        if new_username and new_username.strip():
            new_username = new_username.strip()
            # Check if username already exists
            existing = students.find_one({'username': new_username})
            if existing and existing['username'] != username:
                return JSONResponse({'ok': False, 'error': 'Username already taken'}, status_code=400)
            
            update_doc['username'] = new_username
            response_data['username'] = new_username
            changed_username = new_username
        
        # Update password
        if new_password and new_password.strip():
            update_doc['password'] = generate_password_hash(new_password)
            changed_password = new_password.strip()
        
        if not update_doc:
            return JSONResponse({'ok': False, 'error': 'No changes to make'}, status_code=400)
        
        # Update student
        result = students.update_one(
            {'username': username},
            {'$set': update_doc}
        )
        
        if result.modified_count == 0:
            return JSONResponse({'ok': False, 'error': 'No changes made'}, status_code=400)
        
        # Send notification email about credential changes
        if student_email:
            try:
                email_body = f'''Hello {student_full_name},

Your credentials have been successfully updated on GradEdgeDev.

Changed Information:'''
                
                if changed_username:
                    email_body += f'\n- New Username: {changed_username}'
                
                if changed_password:
                    email_body += f'\n- New Password: {changed_password}'
                
                email_body += '''

If you did not make these changes, please contact your administrator immediately.

Best regards,
GradEdgeDev Team'''
                
                send_otp_email(
                    to_email=student_email,
                    otp='',  # Not used for this notification
                    subject='GradEdgeDev - Credentials Updated',
                    body=email_body
                )
                
                logger.info(f'Credentials change notification sent to {student_email}')
            except Exception as e:
                logger.error(f'Failed to send credentials change notification: {e}')
                # Don't fail the request if email fails
        
        return JSONResponse({
            'ok': True,
            'message': 'Credentials updated successfully',
            'data': response_data
        }, status_code=200)
    
    except Exception as e:
        logger.error(f'Error updating credentials: {e}')
        return JSONResponse({'ok': False, 'error': str(e)}, status_code=500)
