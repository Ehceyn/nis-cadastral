const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🚀 Setting up NIS Cadastral Survey Platform Database...\n');

  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');

    // Check if tables exist
    console.log('2️⃣ Checking database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `;
    
    if (tables.length === 0) {
      console.log('📝 No tables found. Schema needs to be created.');
      console.log('   Run: npm run db:push');
      return;
    }
    
    console.log(`✅ Found ${tables.length} tables in database\n`);
    
    // Check if data exists
    console.log('3️⃣ Checking for existing data...');
    const userCount = await prisma.user.count();
    const surveyorCount = await prisma.surveyor.count();
    const jobCount = await prisma.surveyJob.count();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Surveyors: ${surveyorCount}`);
    console.log(`   Survey Jobs: ${jobCount}\n`);
    
    if (userCount === 0) {
      console.log('🌱 Database is empty. Ready for seeding!');
      console.log('   Run: npm run db:seed');
    } else {
      console.log('✅ Database already contains data');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n🔧 Connection troubleshooting:');
      console.log('1. Check your Supabase project is active');
      console.log('2. Verify connection strings in .env files');
      console.log('3. Ensure your IP is whitelisted (if applicable)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
