require('dotenv').config();
const supabase = require('./services/supabase');

/**
 * Seed data for MediTrack
 * Creates sample hospitals, bed inventory, blood inventory, and alerts
 */

const MUMBAI_HOSPITALS = [
    {
        name: 'KEM Hospital',
        address: 'Acharya Donde Marg, Parel',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0030,
        longitude: 72.8417,
        phone: '+912224107000',
        email: 'info@kemhospital.org'
    },
    {
        name: 'Sion Hospital',
        address: 'Sion West',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0433,
        longitude: 72.8617,
        phone: '+912224076666',
        email: 'sion@hospital.gov.in'
    },
    {
        name: 'Cooper Hospital',
        address: 'Juhu Vile Parle Development Scheme',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0896,
        longitude: 72.8356,
        phone: '+912226201000',
        email: 'cooper@hospital.gov.in'
    },
    {
        name: 'Nair Hospital',
        address: 'Dr. A.L. Nair Road, Mumbai Central',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 18.9983,
        longitude: 72.8397,
        phone: '+912223027643',
        email: 'nair@hospital.gov.in'
    },
    {
        name: 'JJ Hospital',
        address: 'JJ Marg, Byculla',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 18.9625,
        longitude: 72.8314,
        phone: '+912223735555',
        email: 'jj@hospital.gov.in'
    },
    {
        name: 'Rajawadi Hospital',
        address: 'Rajawadi, Ghatkopar East',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0868,
        longitude: 72.9081,
        phone: '+912225157000',
        email: 'rajawadi@hospital.gov.in'
    },
    {
        name: 'Shatabdi Hospital',
        address: 'Govandi',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0544,
        longitude: 72.9119,
        phone: '+912225563000',
        email: 'shatabdi@hospital.gov.in'
    },
    {
        name: 'Kasturba Hospital',
        address: 'Chinchpokli',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 18.9930,
        longitude: 72.8310,
        phone: '+912223027000',
        email: 'kasturba@hospital.gov.in'
    },
    {
        name: 'MT Agarwal Hospital',
        address: 'LBS Marg, Mulund West',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.1760,
        longitude: 72.9560,
        phone: '+912225643000',
        email: 'mtagarwal@hospital.gov.in'
    },
    {
        name: 'Bhabha Hospital',
        address: 'Bandra West',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0596,
        longitude: 72.8295,
        phone: '+912226420000',
        email: 'bhabha@hospital.gov.in'
    },
    {
        name: 'VN Desai Hospital',
        address: 'Santacruz East',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0825,
        longitude: 72.8536,
        phone: '+912226673000',
        email: 'vndesai@hospital.gov.in'
    },
    {
        name: 'Bhagwati Hospital',
        address: 'Borivali West',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.2403,
        longitude: 72.8560,
        phone: '+912228982000',
        email: 'bhagwati@hospital.gov.in'
    }
];

const JAIPUR_HOSPITALS = [
    {
        name: 'SMS Hospital',
        address: 'JLN Marg, Near Collectorate Circle',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        latitude: 26.9124,
        longitude: 75.7873,
        phone: '+911412516294',
        email: 'sms@hospital.gov.in'
    },
    {
        name: 'Jaipuria Hospital',
        address: 'Sector 5, Malviya Nagar',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        latitude: 26.8467,
        longitude: 75.8238,
        phone: '+911412751000',
        email: 'jaipuria@hospital.gov.in'
    },
    {
        name: 'Zanana Hospital',
        address: 'Sanganeri Gate',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        latitude: 26.8983,
        longitude: 75.7873,
        phone: '+911412603000',
        email: 'zanana@hospital.gov.in'
    },
    {
        name: 'Satellite Hospital',
        address: 'Vidyadhar Nagar',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        latitude: 26.9707,
        longitude: 75.8265,
        phone: '+911412722000',
        email: 'satellite@hospital.gov.in'
    },
    {
        name: 'JK Lone Hospital',
        address: 'Jhalana Doongri',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        latitude: 26.9124,
        longitude: 75.8265,
        phone: '+911412700000',
        email: 'jklone@hospital.gov.in'
    },
    {
        name: 'Mahila Chikitsalaya',
        address: 'Gangori Bazaar',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        latitude: 26.9196,
        longitude: 75.7873,
        phone: '+911412650000',
        email: 'mahila@hospital.gov.in'
    },
    {
        name: 'Kanwatia Hospital',
        address: 'Shastri Nagar',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        latitude: 26.9497,
        longitude: 75.7873,
        phone: '+911412680000',
        email: 'kanwatia@hospital.gov.in'
    },
    {
        name: 'Mahatma Gandhi Hospital',
        address: 'Jawahar Lal Nehru Marg, Sector 5',
        city: 'Jaipur',
        district: 'Jaipur',
        state: 'Rajasthan',
        latitude: 26.8467,
        longitude: 75.8150,
        phone: '+911412751500',
        email: 'mghospital@hospital.gov.in'
    }
];

const BED_TYPES = ['ICU', 'general', 'paediatric', 'maternity', 'isolation', 'emergency', 'ventilator'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    try {
        // 1. Insert hospitals
        console.log('📍 Inserting hospitals...');
        const allHospitals = [...MUMBAI_HOSPITALS, ...JAIPUR_HOSPITALS];
        const { data: hospitals, error: hospitalError } = await supabase
            .from('hospitals')
            .insert(allHospitals)
            .select();

        if (hospitalError) {
            console.error('Error inserting hospitals:', hospitalError);
            throw hospitalError;
        }

        console.log(`✅ Inserted ${hospitals.length} hospitals`);

        // 2. Insert bed inventory for each hospital
        console.log('🛏️  Inserting bed inventory...');
        const bedInventory = [];

        hospitals.forEach((hospital, idx) => {
            BED_TYPES.forEach(bedType => {
                let totalBeds, availableBeds;

                if (bedType === 'ICU') {
                    totalBeds = getRandomInt(10, 30);
                    // Some hospitals have critical ICU shortage
                    if (idx % 3 === 0) {
                        availableBeds = getRandomInt(0, 1); // Critical
                    } else if (idx % 3 === 1) {
                        availableBeds = getRandomInt(2, 4); // Low
                    } else {
                        availableBeds = getRandomInt(5, totalBeds);
                    }
                } else if (bedType === 'ventilator') {
                    totalBeds = getRandomInt(5, 15);
                    availableBeds = getRandomInt(0, Math.floor(totalBeds * 0.6));
                } else if (bedType === 'general') {
                    totalBeds = getRandomInt(100, 300);
                    availableBeds = getRandomInt(10, Math.floor(totalBeds * 0.4));
                } else {
                    totalBeds = getRandomInt(20, 80);
                    availableBeds = getRandomInt(0, Math.floor(totalBeds * 0.5));
                }

                bedInventory.push({
                    hospital_id: hospital.id,
                    bed_type: bedType,
                    total_beds: totalBeds,
                    available_beds: availableBeds
                });
            });
        });

        const { error: bedError } = await supabase
            .from('bed_inventory')
            .insert(bedInventory);

        if (bedError) {
            console.error('Error inserting bed inventory:', bedError);
            throw bedError;
        }

        console.log(`✅ Inserted ${bedInventory.length} bed inventory records`);

        // 3. Insert blood inventory for each hospital
        console.log('🩸 Inserting blood inventory...');
        const bloodInventory = [];

        hospitals.forEach((hospital, idx) => {
            BLOOD_GROUPS.forEach(bloodGroup => {
                let unitsAvailable;

                // Create some critical shortages
                if (idx % 4 === 0 && (bloodGroup === 'O-' || bloodGroup === 'AB-')) {
                    unitsAvailable = 0; // Critical shortage
                } else if (idx % 4 === 1 && bloodGroup.includes('-')) {
                    unitsAvailable = getRandomInt(1, 2); // Low
                } else {
                    unitsAvailable = getRandomInt(3, 50);
                }

                bloodInventory.push({
                    hospital_id: hospital.id,
                    blood_group: bloodGroup,
                    units_available: unitsAvailable,
                    units_reserved: getRandomInt(0, 5)
                });
            });
        });

        const { error: bloodError } = await supabase
            .from('blood_inventory')
            .insert(bloodInventory);

        if (bloodError) {
            console.error('Error inserting blood inventory:', bloodError);
            throw bloodError;
        }

        console.log(`✅ Inserted ${bloodInventory.length} blood inventory records`);

        // 4. Create sample alerts for critical situations
        console.log('🚨 Creating sample alerts...');
        const alerts = [];

        // Find hospitals with critical ICU shortage
        const criticalHospitals = hospitals.slice(0, 3);

        criticalHospitals.forEach(hospital => {
            alerts.push({
                hospital_id: hospital.id,
                alert_type: 'bed_shortage',
                message: `CRITICAL: ICU beds critically low at ${hospital.name}`,
                severity: 'critical',
                is_resolved: false
            });
        });

        // Add blood shortage alerts
        alerts.push({
            hospital_id: hospitals[0].id,
            alert_type: 'blood_shortage',
            message: `WARNING: O- blood running low at ${hospitals[0].name}`,
            severity: 'high',
            is_resolved: false
        });

        alerts.push({
            hospital_id: hospitals[4].id,
            alert_type: 'blood_shortage',
            message: `CRITICAL: AB- blood out of stock at ${hospitals[4].name}`,
            severity: 'critical',
            is_resolved: false
        });

        const { error: alertError } = await supabase
            .from('alerts')
            .insert(alerts);

        if (alertError) {
            console.error('Error inserting alerts:', alertError);
            throw alertError;
        }

        console.log(`✅ Created ${alerts.length} sample alerts`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Hospitals: ${hospitals.length}`);
        console.log(`   - Bed records: ${bedInventory.length}`);
        console.log(`   - Blood records: ${bloodInventory.length}`);
        console.log(`   - Alerts: ${alerts.length}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding
seedDatabase();
