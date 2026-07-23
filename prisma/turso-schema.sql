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
    "heroLocation" TEXT NOT NULL DEFAULT '',
    "heroText1" TEXT NOT NULL DEFAULT '',
    "heroText2" TEXT NOT NULL DEFAULT '',
    "heroDesc" TEXT NOT NULL DEFAULT '',
    "heroBtn" TEXT NOT NULL DEFAULT 'Work',
    "aboutTitle" TEXT NOT NULL DEFAULT 'About',
    "aboutDesc1" TEXT NOT NULL DEFAULT '',
    "aboutDesc2" TEXT NOT NULL DEFAULT '',
    "aboutExpertise" TEXT NOT NULL DEFAULT '',
    "profileImage" TEXT NOT NULL DEFAULT '',
    "aboutStats1Label" TEXT NOT NULL DEFAULT '',
    "aboutStats1Value" TEXT NOT NULL DEFAULT '',
    "aboutStats2Label" TEXT NOT NULL DEFAULT '',
    "aboutStats2Value" TEXT NOT NULL DEFAULT '',
    "aboutStats3Label" TEXT NOT NULL DEFAULT '',
    "aboutStats3Value" TEXT NOT NULL DEFAULT '',
    "contactSubtitle" TEXT NOT NULL DEFAULT '',
    "contactTitle1" TEXT NOT NULL DEFAULT '',
    "contactTitle2" TEXT NOT NULL DEFAULT '',
    "contactBtn" TEXT NOT NULL DEFAULT 'Write',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactTelegram" TEXT NOT NULL DEFAULT '',
    "contactBehance" TEXT NOT NULL DEFAULT '',
    "contactDribbble" TEXT NOT NULL DEFAULT '',
    "contactInstagram" TEXT NOT NULL DEFAULT '',
    "contactChannels" TEXT NOT NULL DEFAULT '[]',
    "navbarProjects" TEXT NOT NULL DEFAULT 'Projects',
    "navbarContact" TEXT NOT NULL DEFAULT 'Contact',
    "skillsTitle" TEXT NOT NULL DEFAULT 'Skills',
    "projectsTitle" TEXT NOT NULL DEFAULT 'Work',
    "projectsShowing" TEXT NOT NULL DEFAULT 'Showing',
    "projectsOf" TEXT NOT NULL DEFAULT 'of',
    "projectsViewAll" TEXT NOT NULL DEFAULT 'View all',
    "projectsAllTitle" TEXT NOT NULL DEFAULT 'All work',
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
    "images" TEXT NOT NULL DEFAULT '[]',
    "imageFrame" TEXT NOT NULL DEFAULT '{"zoom":1,"x":50,"y":50}',
    "video" TEXT NOT NULL DEFAULT '',
    "links" TEXT NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT true,
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

