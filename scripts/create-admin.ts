import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function createAdminUser() {
  try {
    const email = 'admin@paytree.com'
    const username = 'admin'
    const password = 'admin123'
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Update existing user to Pro
      const updated = await prisma.user.update({
        where: { email },
        data: {
          subscriptionStatus: 'active',
          subscriptionPlan: 'pro',
          subscriptionInterval: 'yearly',
          name: 'Admin User',
        }
      })
      console.log('✅ Updated existing admin user to Pro status')
      console.log('Email:', email)
      console.log('Username:', updated.username)
      console.log('Password: admin123')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user with Pro status
    const adminUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: 'Admin User',
        bio: 'Administrator account with full Pro access',
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro',
        subscriptionInterval: 'yearly',
        // Set defaults for customization
        theme: 'dark',
        primaryColor: '#3b82f6',
        backgroundColor: '#0f172a',
        backgroundStyle: 'mesh',
        buttonStyle: '3d',
        accentColor: '#00ff88',
        textColor: '#ffffff',
        socialIconPosition: 'bottom',
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('Email:', email)
    console.log('Username:', username)
    console.log('Password: admin123')
    console.log('Status: Pro (Yearly)')
    console.log('\nYou can now login with these credentials')
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
