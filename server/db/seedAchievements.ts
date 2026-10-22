import { pool } from './mysql.js';
import { RowDataPacket } from 'mysql2';

interface SeedAchievement {
  id: string;
  student_id: string;
  title: string;
  category: string;
  description: string;
  achievement_date: string;
  organization: string;
  certificate_file?: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  verified_by?: string | null;
}

export async function populateStudentAchievements(): Promise<number> {
  const connection = await pool.getConnection();
  try {
    console.log('[SeedAchievements] Populating rich student achievements & co-curricular portfolio...');

    // Fetch existing achievement IDs to avoid collisions
    const [existingRows] = await connection.query<RowDataPacket[]>('SELECT id FROM achievements');
    const existingIds = new Set(existingRows.map((r) => r.id as string));

    const records: SeedAchievement[] = [
      // === Student 1: Arun Nathan D (7376232BM001) - Primary Demo Student ===
      {
        id: 'ach_stu_1_01',
        student_id: '1',
        title: 'Smart India Hackathon (SIH) 2025 - First Prize',
        category: 'Hackathon',
        description: 'Developed an AI-driven remote patient monitoring and early triage system under the Healthcare & Medical Tech theme.',
        achievement_date: '2025-11-20',
        organization: 'Ministry of Education & AICTE',
        certificate_file: 'https://credentials.gov.in/sih2025/cert_7376232BM001.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_1_02',
        student_id: '1',
        title: 'IEEE EMBS International Conference Paper Presentation',
        category: 'Paper Presentation',
        description: 'Presented research on "Low-cost Non-invasive Glucose Estimation using Photoplethysmography and Deep Neural Networks".',
        achievement_date: '2025-09-15',
        organization: 'IEEE Engineering in Medicine and Biology Society',
        certificate_file: 'https://ieee-embs.org/proceedings/2025/cert_arun.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_1_03',
        student_id: '1',
        title: 'AWS Certified Solutions Architect – Associate',
        category: 'Certification',
        description: 'Demonstrated comprehensive knowledge of AWS architectures, cloud security, automated pipelines, and cost optimization.',
        achievement_date: '2025-05-10',
        organization: 'Amazon Web Services (AWS)',
        certificate_file: 'https://aws.amazon.com/verification/AWS039482914',
        verification_status: 'Verified',
        verified_by: '6',
      },
      {
        id: 'ach_stu_1_04',
        student_id: '1',
        title: 'National Level Medical Device Innovation Expo Winner',
        category: 'Project Competition',
        description: 'Secured Best Hardware-Software Prototype Award for wearable arrhythmia warning wristband with embedded edge-ML.',
        achievement_date: '2025-03-12',
        organization: 'Indian Biomedical Society & Anna University',
        certificate_file: 'https://annauniv.edu/expo2025/cert_bm001.pdf',
        verification_status: 'Verified',
        verified_by: '6',
      },
      {
        id: 'ach_stu_1_05',
        student_id: '1',
        title: 'State Inter-Collegiate Athletics Meet 100m Sprint Gold',
        category: 'Sports',
        description: 'Won 1st place gold medal in the State University Inter-Collegiate Men Athletic Championship.',
        achievement_date: '2024-12-08',
        organization: 'State University Sports Board',
        certificate_file: 'https://sports.stateuniv.edu/awards/2024_track_gold.pdf',
        verification_status: 'Verified',
        verified_by: '6',
      },
      {
        id: 'ach_stu_1_06',
        student_id: '1',
        title: 'NPTEL Elite+Gold: Deep Learning for Computer Vision',
        category: 'Certification',
        description: 'Scored 94% with Elite+Gold medal ranking in top 1% nationwide in SWAYAM 12-week certification course.',
        achievement_date: '2026-02-18',
        organization: 'NPTEL / IIT Madras',
        certificate_file: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL26CS01S394',
        verification_status: 'Pending',
        verified_by: null,
      },

      // === Students assigned to Faculty 221 (AD001 Shalini Shanmugam) ===
      // Student 1149: Pavithra C (7376232AD049)
      {
        id: 'ach_stu_1149_01',
        student_id: '1149',
        title: 'Google Cloud Certified Professional Data Engineer',
        category: 'Certification',
        description: 'Successfully passed GCP professional certification on data pipelines, BigQuery warehousing, and Vertex AI integrations.',
        achievement_date: '2026-01-14',
        organization: 'Google Cloud Training & Certification',
        certificate_file: 'https://google.accredible.com/cert/GCP-DE-49281',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_1149_02',
        student_id: '1149',
        title: 'Kaggle Grand Hackathon - Top 2% Silver Medal',
        category: 'Hackathon',
        description: 'Built multimodal transformer pipeline for satellite land degradation segmentation; placed 14th out of 980 global teams.',
        achievement_date: '2025-10-05',
        organization: 'Kaggle / Google DeepMind',
        certificate_file: 'https://kaggle.com/certificates/pavithra_silver',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_1149_03',
        student_id: '1149',
        title: 'Inter-College Youth Parliament Best Speaker Award',
        category: 'Cultural',
        description: 'Adjudged Best Parliamentarian in the State Inter-University Model Parliament on National Education Policy.',
        achievement_date: '2025-04-22',
        organization: 'State Youth Commission',
        certificate_file: 'https://youth.gov.in/cert_parliament_2025.pdf',
        verification_status: 'Verified',
        verified_by: '221',
      },

      // Student 1159: Harini Devi N (7376232AD059)
      {
        id: 'ach_stu_1159_01',
        student_id: '1159',
        title: 'International Cybersecurity CTF 2025 Finalist',
        category: 'Technical Symposium',
        description: 'Solved binary exploitation and cryptography challenges in 48-hour global Capture The Flag competition.',
        achievement_date: '2025-11-12',
        organization: 'Nullcon Security Conference',
        certificate_file: 'https://nullcon.net/ctf/cert_harini.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_1159_02',
        student_id: '1159',
        title: 'Oracle Certified Professional Java SE 17 Developer',
        category: 'Certification',
        description: 'Validated enterprise backend programming, concurrent multithreading, modularity, and garbage collection tuning.',
        achievement_date: '2025-06-30',
        organization: 'Oracle University',
        certificate_file: 'https://catalog-education.oracle.com/cert_harini_ocp.pdf',
        verification_status: 'Verified',
        verified_by: '221',
      },

      // Student 1176: Saranya Sri J (7376232AD076)
      {
        id: 'ach_stu_1176_01',
        student_id: '1176',
        title: 'National Level Paper on Explainable AI in Credit Scoring',
        category: 'Paper Presentation',
        description: 'Awarded 1st place in IEEE Student Branch National Conference on Financial Technologies & Responsible AI.',
        achievement_date: '2026-02-04',
        organization: 'IEEE Madras Section',
        certificate_file: 'https://ieeemadras.org/conf2026/paper_saranya.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_1176_02',
        student_id: '1176',
        title: 'State Championship Badminton Doubles Silver Medalist',
        category: 'Sports',
        description: 'Represented college in the State Inter-Zone Badminton Tournament; secured silver medal in women doubles.',
        achievement_date: '2025-08-18',
        organization: 'Tamil Nadu Sports Development Authority',
        certificate_file: 'https://sdat.tn.gov.in/awards/badminton_2025_silver.pdf',
        verification_status: 'Verified',
        verified_by: '221',
      },

      // Student 1181: Nandha B (7376232AD081)
      {
        id: 'ach_stu_1181_01',
        student_id: '1181',
        title: 'Flipkart GRiD 6.0 Robotics Challenge National Finalist',
        category: 'Hackathon',
        description: 'Engineered an automated package optical sortation and QR localization bot with real-time OpenCV tracking.',
        achievement_date: '2025-10-28',
        organization: 'Flipkart Internet Pvt Ltd',
        certificate_file: 'https://unstop.com/certificates/grid6_nandha.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_1181_02',
        student_id: '1181',
        title: 'Certified Ethical Hacker (CEH v12)',
        category: 'Certification',
        description: 'Successfully passed EC-Council CEH exam covering network vulnerability assessment and defense architecture.',
        achievement_date: '2025-03-24',
        organization: 'EC-Council International',
        certificate_file: 'https://eccouncil.org/verify/CEH-8947291',
        verification_status: 'Verified',
        verified_by: '221',
      },

      // Student 1196: Oviya Nachiyar V (7376232AD096)
      {
        id: 'ach_stu_1196_01',
        student_id: '1196',
        title: 'MIT COVID-19 / AI Healthcare Challenge - 2nd Prize',
        category: 'Project Competition',
        description: 'Built decentralized epidemiological tracking platform utilizing privacy-preserving federated machine learning.',
        achievement_date: '2025-12-02',
        organization: 'MIT Hacking Medicine & Health Incubator',
        certificate_file: 'https://mit.edu/healthhack/2025/cert_oviya.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_1196_02',
        student_id: '1196',
        title: 'Classical Classical Dance State Level Kalai Sudar Award',
        category: 'Cultural',
        description: 'Conferred Kalai Sudar title at the State Youth Art & Cultural Conclave for solo Bharatanatyam recital.',
        achievement_date: '2025-01-19',
        organization: 'State Department of Art and Culture',
        certificate_file: 'https://artandculture.gov.in/awards/oviya_recital.pdf',
        verification_status: 'Verified',
        verified_by: '221',
      },

      // === Student 10: Jagadeesh K (7376232BM010) ===
      {
        id: 'ach_stu_10_01',
        student_id: '10',
        title: 'Open Source Contributor: TensorFlow Healthcare Models',
        category: 'Coding',
        description: 'Merged 4 pull requests in official TensorFlow Models repository improving ECG transformer inference efficiency.',
        achievement_date: '2025-11-04',
        organization: 'GitHub & TensorFlow Community',
        certificate_file: 'https://github.com/tensorflow/models/pulls/jagadeesh',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_10_02',
        student_id: '10',
        title: 'Biomedical Instrumentation Design Challenge 1st Place',
        category: 'Project Competition',
        description: 'Designed portable low-noise EMG acquisition circuit with Bluetooth Low Energy streaming.',
        achievement_date: '2025-04-18',
        organization: 'IIT Madras Shaastra Technical Festival',
        certificate_file: 'https://shaastra.org/certs/bm_design_winner.pdf',
        verification_status: 'Verified',
        verified_by: '12',
      },

      // === Student 100: Ramya Rani N (7376232BM100) ===
      {
        id: 'ach_stu_100_01',
        student_id: '100',
        title: 'Microsoft Certified: Azure AI Engineer Associate',
        category: 'Certification',
        description: 'Earned certification verifying skills in Azure Cognitive Services, Computer Vision, and Azure OpenAI LLM orchestration.',
        achievement_date: '2026-01-20',
        organization: 'Microsoft Certification Services',
        certificate_file: 'https://learn.microsoft.com/credentials/cert_ramya_azure',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_100_02',
        student_id: '100',
        title: 'National Level Hackathon for Social Good Runner-Up',
        category: 'Hackathon',
        description: 'Developed an automated braille text-to-speech scanner for visually impaired elementary students.',
        achievement_date: '2025-07-14',
        organization: 'Rotary International & Tech4Good',
        certificate_file: 'https://tech4good.org/awards/ramya_scanner.pdf',
        verification_status: 'Verified',
        verified_by: '3',
      },

      // === Additional students across batch to ensure rich diversity ===
      {
        id: 'ach_stu_2_01',
        student_id: '2',
        title: 'National Coding Championship - Rank 42 Nationwide',
        category: 'Coding',
        description: 'Achieved Candidate Master rating and ranked 42nd out of 15,000 collegiate contestants.',
        achievement_date: '2025-12-10',
        organization: 'CodeChef & Unstop',
        certificate_file: 'https://codechef.com/certificates/rank42.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_3_01',
        student_id: '3',
        title: 'Docker & Kubernetes Cloud Architecture Bootcamp',
        category: 'Workshop',
        description: 'Completed 40-hour rigorous hands-on containerization and CI/CD cluster deployment training.',
        achievement_date: '2025-08-25',
        organization: 'Linux Foundation Training',
        certificate_file: 'https://linuxfoundation.org/certs/bootcamp_cert.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_4_01',
        student_id: '4',
        title: 'Inter-Collegiate Table Tennis Tournament Gold Medal',
        category: 'Sports',
        description: 'Individual singles champion in the 2025 State University Table Tennis Trophy.',
        achievement_date: '2025-09-02',
        organization: 'State Collegiate Sports Association',
        certificate_file: 'https://sports.stateuniv.edu/tt_gold.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_5_01',
        student_id: '5',
        title: 'Blockchain & Web3 Developer Fellowship Winner',
        category: 'Hackathon',
        description: 'Created verifiable credential registry with zero-knowledge cryptographic proof verification.',
        achievement_date: '2026-02-15',
        organization: 'Ethereum India Fellowship',
        certificate_file: 'https://eif.org/fellowship_cert.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_6_01',
        student_id: '6',
        title: 'National Technical Paper Presentation on IoT Smart Cities',
        category: 'Paper Presentation',
        description: 'Best Paper Award in National Conference on Sustainable Urban Infrastructure.',
        achievement_date: '2025-10-14',
        organization: 'Institution of Engineers (India)',
        certificate_file: 'https://ieindia.org/proceedings/iot_paper.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
      {
        id: 'ach_stu_7_01',
        student_id: '7',
        title: 'Meta Frontend Developer Professional Certificate',
        category: 'Certification',
        description: 'Mastered modern React, responsive UI systems, state machines, and UX accessibility.',
        achievement_date: '2025-06-11',
        organization: 'Meta / Coursera',
        certificate_file: 'https://coursera.org/verify/meta_frontend_7.pdf',
        verification_status: 'Verified',
        verified_by: '14',
      },
      {
        id: 'ach_stu_8_01',
        student_id: '8',
        title: 'Autonomous Rover Obstacle Avoidance Prototype Winner',
        category: 'Project Competition',
        description: '1st Prize at National Robotics Symposium for LiDAR SLAM mapping miniature rover.',
        achievement_date: '2025-11-29',
        organization: 'Robotics Society of India',
        certificate_file: 'https://robotics.org.in/awards/slam_rover.pdf',
        verification_status: 'Pending',
        verified_by: null,
      },
    ];

    let insertedCount = 0;
    const now = new Date();

    for (const ach of records) {
      if (existingIds.has(ach.id)) {
        // Update if already present
        await connection.query(
          `UPDATE achievements SET
            student_id = ?, title = ?, category = ?, description = ?,
            achievement_date = ?, organization = ?, certificate_file = ?,
            verification_status = ?, verified_by = ?, updated_at = ?
           WHERE id = ?`,
          [
            ach.student_id,
            ach.title,
            ach.category,
            ach.description,
            ach.achievement_date,
            ach.organization,
            ach.certificate_file || null,
            ach.verification_status,
            ach.verified_by || null,
            now,
            ach.id,
          ]
        );
      } else {
        // Insert new
        await connection.query(
          `INSERT INTO achievements (
            id, student_id, title, category, description, achievement_date,
            organization, certificate_file, verification_status, verified_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ach.id,
            ach.student_id,
            ach.title,
            ach.category,
            ach.description,
            ach.achievement_date,
            ach.organization,
            ach.certificate_file || null,
            ach.verification_status,
            ach.verified_by || null,
            now,
            now,
          ]
        );
        insertedCount++;
      }
    }

    console.log(`[SeedAchievements] Successfully populated achievements! Total defined: ${records.length}, newly inserted: ${insertedCount}`);
    return records.length;
  } finally {
    connection.release();
  }
}

// Execute if called directly
if (process.argv[1]?.endsWith('seedAchievements.ts') || process.argv[1]?.endsWith('seedAchievements.js')) {
  populateStudentAchievements()
    .then(async (count) => {
      console.log(`[SeedAchievements] Finished seeding ${count} achievements.`);
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[SeedAchievements] Error:', err);
      await pool.end();
      process.exit(1);
    });
}
