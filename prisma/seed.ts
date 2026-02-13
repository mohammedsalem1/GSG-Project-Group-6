import { BadgeCategory, PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.review.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.swapRequest.deleteMany({});
  await prisma.userSkill.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.category.deleteMany({});

  // Categories + realistic skills (1000+)
  const categoriesData = [
    {
      name: 'Programming',
      icon: '💻',
      skills: [
        // Core Languages
        'JavaScript','TypeScript','Python','Java','C#','C++','Go','Rust','PHP','Ruby','Kotlin','Swift','Dart',
        // Advanced / frameworks
        'Functional Programming','Object Oriented Programming','Reactive Programming','Asynchronous Programming',
        'Data Structures','Algorithms','Graph Algorithms','Design Patterns','Multithreading','Memory Management',
        'Concurrency','Networking','Security','Encryption','Blockchain Development','Smart Contracts','Solidity',
        'WebAssembly','Game Development','Unity','Unreal Engine','Embedded Systems','IoT Programming','Scripting',
        'Automation','Test Driven Development','Clean Code','Refactoring','Continuous Integration','Continuous Delivery',
        'Code Review','Version Control','Git','GitHub','GitLab','Bitbucket','CI/CD','Docker','Containers','Kubernetes',
        'Serverless','Lambda','Microservices','REST API','GraphQL','Event Driven Architecture','Message Queues',
        'Kafka','RabbitMQ','Redis Streams','Database Indexing','SQL Optimization','NoSQL','MongoDB','PostgreSQL',
        'MySQL','SQLite','Oracle DB','MariaDB','Firebase','Redis','Cassandra','ElasticSearch','Full Stack Development'
      ],
    },
    {
      name: 'Frontend',
      icon: '🎨',
      skills: [
        'HTML','CSS','Sass','Less','Stylus','JavaScript','TypeScript','React','Next.js','Vue.js','Nuxt.js','Angular',
        'Svelte','Bootstrap','Tailwind CSS','Material UI','Chakra UI','Styled Components','Emotion','Framer Motion',
        'Responsive Design','Cross Browser Compatibility','Accessibility','SEO','Performance Optimization',
        'State Management','Redux','MobX','Pinia','Vuex','Recoil','React Query','Zustand','Axios','Fetch API',
        'DOM Manipulation','Event Handling','Animations','Canvas API','SVG','WebGL','Three.js','D3.js','Chart.js',
        'Testing Frontend','Jest','React Testing Library','Cypress','Playwright','Storybook','Component Libraries'
      ],
    },
    {
      name: 'Backend',
      icon: '🧠',
      skills: [
        'Node.js','NestJS','Express.js','Fastify','Koa','Django','Flask','Spring Boot','ASP.NET Core','Laravel',
        'Ruby on Rails','Phoenix','API Development','REST API','GraphQL','Microservices','Monolithic Architecture',
        'Server Side Rendering','Authentication','Authorization','JWT','OAuth2','Sessions','Cookies','Database Integration',
        'ORM','Prisma','TypeORM','Sequelize','Mongoose','Query Optimization','Caching','Redis','Message Queues',
        'RabbitMQ','Kafka','Celery','Background Jobs','Task Scheduling','Logging','Monitoring','Error Handling',
        'Performance Tuning','Load Balancing','Scaling','Security','Encryption','Rate Limiting','Input Validation',
        'WebSockets','Socket.IO','Real-time Communication','Streaming','File Upload','Email Sending','Notifications'
      ],
    },
    {
      name: 'Databases',
      icon: '🗄️',
      skills: [
        'PostgreSQL','MySQL','MongoDB','Redis','SQLite','MariaDB','Oracle DB','Firebase','Cassandra','ElasticSearch',
        'DynamoDB','Graph Databases','Neo4j','Time Series Databases','InfluxDB','Database Indexing','Query Optimization',
        'Normalization','Denormalization','ACID','Transactions','Stored Procedures','Views','Triggers','Replication',
        'Sharding','Partitioning','Backup & Restore','Data Migration','ETL','Data Warehousing','Big Data','Hadoop','Spark'
      ],
    },
    {
      name: 'DevOps & Cloud',
      icon: '☁️',
      skills: [
        'Docker','Docker Compose','Kubernetes','Helm','AWS','Azure','Google Cloud','Terraform','Ansible','CI/CD',
        'GitHub Actions','GitLab CI','Jenkins','CircleCI','Nginx','Apache','Linux','Ubuntu','CentOS','Debian',
        'Monitoring','Prometheus','Grafana','Log Management','ELK Stack','Cloud Architecture','Serverless','Lambda',
        'API Gateway','Load Balancing','Scaling','High Availability','Disaster Recovery','Backup','Networking','VPC',
        'Subnets','Security Groups','IAM','Policies','Secrets Management','Environment Variables','Container Security',
        'SSL/TLS','HTTPS','DNS','CDN','Caching'
      ],
    },
    {
      name: 'Testing',
      icon: '🧪',
      skills: [
        'Unit Testing','Integration Testing','End-to-End Testing','TDD','BDD','Jest','Mocha','Chai','Cypress',
        'Playwright','Selenium','React Testing Library','Enzyme','Test Coverage','Mocking','Stubs','Spies',
        'Continuous Testing','Regression Testing','Performance Testing','Load Testing','Stress Testing','Security Testing'
      ],
    },
    {
      name: 'APIs & Architecture',
      icon: '🔌',
      skills: [
        'REST API','GraphQL','gRPC','SOAP','Microservices','Monolithic Architecture','Service Oriented Architecture',
        'Event Driven Architecture','Message Queues','Kafka','RabbitMQ','Redis Streams','API Versioning','Rate Limiting',
        'Caching','Authentication','Authorization','JWT','OAuth2','OpenID Connect','API Documentation','Swagger','OpenAPI',
        'System Design','Clean Architecture','Scalability','High Availability','Performance Optimization'
      ],
    },
    {
      name: 'Mobile',
      icon: '📱',
      skills: [
        'React Native','Flutter','SwiftUI','UIKit','Android Development','iOS Development','Kotlin','Java','Dart',
        'Mobile UI Design','Mobile UX','Push Notifications','Mobile Performance Optimization','Offline Mode',
        'App Store Deployment','Play Store Deployment','Mobile Testing','Unit Testing','Integration Testing','Flutter Bloc',
        'Provider','GetX','Redux','MVVM','MVC','Clean Architecture'
      ],
    },
    {
      name: 'Soft Skills',
      icon: '🤝',
      skills: [
        'Communication','Teamwork','Problem Solving','Time Management','Leadership','Critical Thinking',
        'Negotiation','Adaptability','Conflict Resolution','Presentation Skills','Networking','Empathy',
        'Decision Making','Creativity','Collaboration','Emotional Intelligence','Mentoring','Coaching','Motivation'
      ],
    },
    {
      name: 'Languages',
      icon: '🌍',
      skills: [
        'English','Arabic','French','Spanish','German','Turkish','Mandarin','Japanese','Korean','Russian','Portuguese',
        'Hindi','Bengali','Italian','Dutch','Swedish','Norwegian','Finnish','Danish','Polish','Greek'
      ],
    },
    {
      name: 'Design',
      icon: '🎨',
      skills: [
        'UI Design','UX Design','Interaction Design','Wireframing','Prototyping','User Research','User Testing',
        'Information Architecture','Design Systems','Figma','Adobe XD','Sketch','Photoshop','Illustrator','InVision',
        'Canva','Typography','Color Theory','Visual Design','Responsive Design','Motion Design','Branding',
        'Graphic Design','Illustration','3D Design','Adobe After Effects','Adobe Premiere','Principles of Design'
      ],
    },
    {
        name: 'Music & Art',
        icon: '🎵',
        skills: [
          'Guitar', 'Piano', 'Violin', 'Singing', 'Drawing', 'Painting', 'Sculpture', 'Photography', 'Music Theory'
        ],
      },
      {
        name: 'Teaching',
        icon: '📝',
        skills: [
          'English Teaching', 'Math Teaching', 'Science Teaching', 'Lesson Planning', 'Classroom Management', 'Tutoring'
        ],
      },
    {
      name: 'Others',
      icon: '➕',
      skills: [],
    },
  ];

  // Insert categories + skills
  for (const cat of categoriesData) {
    const category = await prisma.category.create({data:{ 
        name: cat.name,
        icon: cat.icon,
        isActive: true
      }})
    if (cat.skills.length) {
      await prisma.skill.createMany({
        data: cat.skills.map((skill) => ({
          name: skill,
          categoryId: category.id,
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }
  }

  console.log('✅ 1000+ Realistic skills seed completed');

    console.log('🏆 Creating badges...');

  const badges = [
    {
      name: 'First Exchange',
      description: 'Unlocked after 1 completed session',
      icon: '🎯',
      category: BadgeCategory.ACHIEVEMENT,
      requirement: '1',
      points: 50,
    },
    {
      name: 'Active Member',
      description: 'Unlocked after 10 completed sessions',
      icon: '🌟',
      category: BadgeCategory.ACHIEVEMENT,
      requirement: '10',
      points: 75,
    },
    {
      name: 'Skill Exchanger',
      description: 'Unlocked after 25 completed sessions',
      icon: '🔄',
      category: BadgeCategory.ACHIEVEMENT,
      requirement: '25',
      points: 100,
    },
    {
      name: 'Experienced',
      description: 'Unlocked after 50 completed sessions',
      icon: '⚡',
      category: BadgeCategory.SPECIAL,
      requirement: '50',
      points: 150,
    },
    {
      name: 'Core Contributor',
      description: 'Unlocked after 80 completed sessions',
      icon: '👑',
      category: BadgeCategory.SPECIAL,
      requirement: '80',
      points: 200,
    },
  ]
    for (const badge of badges) {
    await prisma.badge.create({
      data:{ 
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          requirement: badge.requirement,
          points: badge.points,
      }
    });
  } 
    console.log(`✅ ${badges.length} badges created seed completed`);

}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
