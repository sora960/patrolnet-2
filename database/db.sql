-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 01, 2025 at 08:48 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db`
--

CREATE DATABASE IF NOT EXISTS `db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `db`;

-- --------------------------------------------------------

--
-- Table structure for table `incident_types`
--

CREATE TABLE IF NOT EXISTS `incident_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Default incident types
INSERT INTO `incident_types` (`name`, `icon`, `color`) VALUES
('Fire', '🔥', '#ff4444'),
('Medical Emergency', '🚑', '#ff6b6b'),
('Accident', '🚗', '#ffa500'),
('Theft', '🔒', '#9b59b6'),
('Violence', '⚠️', '#e74c3c'),
('Noise Complaint', '🔊', '#3498db'),
('Suspicious Activity', '👁️', '#f39c12'),
('Other', '📋', '#95a5a6');

-- --------------------------------------------------------

--
-- Table structure for table `incident_report`
--

CREATE TABLE `incident_report` (
  `id` int(4) NOT NULL,
  `incident_type` varchar(255) DEFAULT NULL,
  `reported_by` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `datetime` datetime DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `assigned` varchar(255) DEFAULT NULL,
  `resolved_by` varchar(255) DEFAULT NULL,
  `resolved_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `ID` int(255) NOT NULL,
  `USER` varchar(255) NOT NULL,
  `TIME` varchar(255) NOT NULL,
  `TIME_IN` varchar(255) DEFAULT NULL,
  `TIME_OUT` varchar(255) DEFAULT NULL,
  `LOCATION` varchar(255) DEFAULT NULL,
  `ACTION` varchar(255) NOT NULL,
  `time_in_photo` varchar(255) DEFAULT NULL,
  `time_out_photo` varchar(255) DEFAULT NULL,
  `time_in_video` varchar(255) DEFAULT NULL,
  `time_out_video` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Optional: firewall blocklist used by server.js
CREATE TABLE IF NOT EXISTS `firewall_blocked_ips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(64) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ip_address` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Optional: firewall access logs used by server.js
CREATE TABLE IF NOT EXISTS `firewall_access_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(64) NOT NULL,
  `user` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `status` varchar(32) NOT NULL,
  `timestamp` datetime NOT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_ip_address` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs_patrol`
--

CREATE TABLE `logs_patrol` (
  `ID` int(255) NOT NULL,
  `USER` varchar(255) NOT NULL,
  `TIME` varchar(255) NOT NULL,
  `LOCATION` varchar(255) NOT NULL,
  `ACTION` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs_resident`
--

CREATE TABLE `logs_resident` (
  `ID` int(255) NOT NULL,
  `USER` varchar(255) NOT NULL,
  `TIME` varchar(255) NOT NULL,
  `LOCATION` varchar(255) DEFAULT NULL,
  `ACTION` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `ID` int(255) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `USER` varchar(255) NOT NULL,
  `STATUS` varchar(255) NOT NULL,
  `LOCATION` varchar(255) DEFAULT NULL,
  `DAY` varchar(20) DEFAULT NULL,
  `START_TIME` varchar(20) DEFAULT NULL,
  `END_TIME` varchar(20) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT 'All',
  `TIME` varchar(255) DEFAULT NULL,
  `IMAGE` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `ID` int(11) NOT NULL,
  `USER` varchar(255) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `NAME` varchar(255) NOT NULL,
  `ADDRESS` varchar(255) DEFAULT NULL,
  `ROLE` varchar(255) NOT NULL,
  `STATUS` varchar(255) DEFAULT 'Pending',
  `IMAGE` varchar(255) NOT NULL,
  `EMAIL` varchar(255) NOT NULL,
  `push_token` varchar(255) DEFAULT NULL,
  `verification_token` varchar(255) DEFAULT NULL,
  `email_verification_code` VARCHAR(10) DEFAULT NULL,
  `email_verification_code_expires_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`ID`, `USER`, `PASSWORD`, `NAME`, `ADDRESS`, `ROLE`, `STATUS`, `IMAGE`, `EMAIL`, `push_token`) VALUES
(1, 'admin', 'admin', 'John Doe', 'address@', 'Admin', 'Verified', '1748760269580-559878099.jpg', 'johndoe@gmail.com', NULL);


--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `description` text NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `incident_report`
--
ALTER TABLE `incident_report`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `logs_patrol`
--
ALTER TABLE `logs_patrol`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `logs_resident`
--
ALTER TABLE `logs_resident`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`ID`);

-- Add schedules foreign key after users primary key exists
ALTER TABLE `schedules`
  ADD CONSTRAINT `fk_schedules_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `ID` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs_patrol`
--
ALTER TABLE `logs_patrol`
  MODIFY `ID` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs_resident`
--
ALTER TABLE `logs_resident`
  MODIFY `ID` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `ID` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

--
-- Table structure for table `announcements`
--

CREATE TABLE `contact_messages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `status` VARCHAR(50) DEFAULT 'unread',
  `replies` JSON DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `announcements` (
  `_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `description` TEXT NOT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `posted_by` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tourist_spots`
--

CREATE TABLE `tourist_spots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `location` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
