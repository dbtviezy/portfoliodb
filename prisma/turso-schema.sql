-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "heroLocation" TEXT NOT NULL DEFAULT 'Based in Russia',
    "heroText1" TEXT NOT NULL DEFAULT 'MOTION DESIGNER',
    "heroText2" TEXT NOT NULL DEFAULT 'CREATIVE DEVELOPER',
    "heroDesc" TEXT NOT NULL DEFAULT 'Creating high-end motion graphics...',
    "heroBtn" TEXT NOT NULL DEFAULT 'Explore Projects',
    "aboutTitle" TEXT NOT NULL DEFAULT 'ABOUT ME',
    "aboutDesc1" TEXT NOT NULL DEFAULT 'Motion designer and digital creative...',
    "aboutDesc2" TEXT NOT NULL DEFAULT 'My approach combines meticulous...',
    "aboutExpertise" TEXT NOT NULL DEFAULT 'WHAT I DO',
    "profileImage" TEXT NOT NULL DEFAULT '',
    "aboutStats1Label" TEXT NOT NULL DEFAULT 'Years Experience',
    "aboutStats1Value" TEXT NOT NULL DEFAULT '5+',
    "aboutStats2Label" TEXT NOT NULL DEFAULT 'Projects Delivered',
    "aboutStats2Value" TEXT NOT NULL DEFAULT '50+',
    "aboutStats3Label" TEXT NOT NULL DEFAULT 'Team Collaborations',
    "aboutStats3Value" TEXT NOT NULL DEFAULT '10+',
    "contactSubtitle" TEXT NOT NULL DEFAULT 'Get in Touch',
    "contactTitle1" TEXT NOT NULL DEFAULT 'Let''s build something',
    "contactTitle2" TEXT NOT NULL DEFAULT 'great together.',
    "contactBtn" TEXT NOT NULL DEFAULT 'Write me',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactTelegram" TEXT NOT NULL DEFAULT '',
    "contactBehance" TEXT NOT NULL DEFAULT '',
    "contactDribbble" TEXT NOT NULL DEFAULT '',
    "contactInstagram" TEXT NOT NULL DEFAULT '',
    "contactChannels" TEXT NOT NULL DEFAULT '[]',
    "navbarProjects" TEXT NOT NULL DEFAULT 'Projects',
    "navbarContact" TEXT NOT NULL DEFAULT 'Contact',
    "skillsTitle" TEXT NOT NULL DEFAULT 'SKILLS & TOOLS',
    "projectsTitle" TEXT NOT NULL DEFAULT 'SELECTED PROJECTS',
    "projectsShowing" TEXT NOT NULL DEFAULT 'Showing',
    "projectsOf" TEXT NOT NULL DEFAULT 'of',
    "projectsViewAll" TEXT NOT NULL DEFAULT 'View All Projects',
    "projectsAllTitle" TEXT NOT NULL DEFAULT 'ALL PROJECTS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExpertiseItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL,
    "links" TEXT NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_lang_key" ON "Portfolio"("lang");

-- CreateIndex
CREATE INDEX "Project_featured_idx" ON "Project"("featured");

-- CreateIndex
CREATE INDEX "Project_lang_idx" ON "Project"("lang");

