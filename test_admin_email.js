// Test script to send admin summary email
const { emailService } = require('./server/services/email');
const { storage } = require('./server/storage');

async function testAdminEmail() {
  try {
    console.log('Testing admin email notification...');
    
    // Create test admin user
    const testAdmin = {
      id: 'test-admin',
      email: 'averyjs@gmail.com',
      firstName: 'Avery',
      lastName: 'Admin',
      isAdmin: true,
      organizationId: 2
    };
    
    // Create test match data
    const testMatches = [
      {
        id: 1,
        user1Id: 'user1',
        user2Id: 'user2',
        matchScore: 85,
        monthYear: '2025-01',
        status: 'pending',
        createdAt: new Date(),
        user1: {
          id: 'user1',
          email: 'user1@test.com',
          firstName: 'John',
          lastName: 'Doe',
          jobTitle: 'Software Engineer',
          company: 'Tech Corp'
        },
        user2: {
          id: 'user2',
          email: 'user2@test.com',
          firstName: 'Jane',
          lastName: 'Smith',
          jobTitle: 'Product Manager',
          company: 'Innovation Inc'
        }
      }
    ];
    
    // Create test meeting data
    const testMeetings = [
      {
        id: 1,
        matchId: 1,
        scheduledAt: new Date('2025-01-15T14:00:00Z'),
        meetingType: 'video',
        duration: 30,
        meetingLink: 'https://meet.google.com/test-meeting',
        status: 'scheduled',
        match: testMatches[0]
      }
    ];
    
    console.log('Sending admin summary email...');
    await emailService.sendAdminMatchSummary(
      testAdmin,
      'Test Community',
      testMatches,
      testMeetings
    );
    
    console.log('✅ Test admin email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending test admin email:', error);
  }
}

testAdminEmail();