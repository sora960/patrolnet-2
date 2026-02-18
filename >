/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.2.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: db
-- ------------------------------------------------------
-- Server version	12.2.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `description` text NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `description` text NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `posted_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `timestamp` datetime NOT NULL,
  `status` varchar(50) DEFAULT 'unread',
  `replies` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`replies`)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `firewall_access_logs`
--

DROP TABLE IF EXISTS `firewall_access_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `firewall_access_logs` (
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firewall_access_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `firewall_access_logs` WRITE;
/*!40000 ALTER TABLE `firewall_access_logs` DISABLE KEYS */;
INSERT INTO `firewall_access_logs` VALUES
(1,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-16 13:16:38','f89434039f31b284'),
(2,'192.168.1.8','test_resident','POST /login','Success','2026-02-16 16:22:26','f89434039f31b284'),
(3,'192.168.1.8','test_resident','POST /login','Success','2026-02-16 16:24:10','f89434039f31b284'),
(4,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-16 16:32:03','f89434039f31b284'),
(5,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-16 16:35:02','f89434039f31b284'),
(6,'192.168.1.8','test_resident','POST /login','Success','2026-02-16 17:02:58','f89434039f31b284'),
(7,'192.168.1.8','test_resident','POST /login','Success','2026-02-16 17:04:39','f89434039f31b284'),
(8,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-16 17:05:43','f89434039f31b284'),
(9,'192.168.1.8','test_resident','POST /login','Success','2026-02-16 17:18:02','f89434039f31b284'),
(10,'192.168.1.8','test_resident','POST /login','Success','2026-02-16 17:53:11','f89434039f31b284'),
(11,'192.168.1.8','test_resident','POST /login','Success','2026-02-16 20:26:34','f89434039f31b284'),
(12,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-16 20:28:00','f89434039f31b284'),
(13,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-18 16:57:37','f89434039f31b284'),
(14,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-18 17:17:55','f89434039f31b284'),
(15,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-18 17:20:55','f89434039f31b284'),
(16,'192.168.1.8','test_resident','POST /login','Success','2026-02-18 17:42:30','f89434039f31b284'),
(17,'192.168.1.8','admin_tanod','POST /login','Success','2026-02-18 17:43:24','f89434039f31b284'),
(18,'127.0.0.1','admin','POST /login','Success','2026-02-18 18:13:24',NULL);
/*!40000 ALTER TABLE `firewall_access_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `firewall_blocked_ips`
--

DROP TABLE IF EXISTS `firewall_blocked_ips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `firewall_blocked_ips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(64) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ip_address` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `firewall_blocked_ips`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `firewall_blocked_ips` WRITE;
/*!40000 ALTER TABLE `firewall_blocked_ips` DISABLE KEYS */;
/*!40000 ALTER TABLE `firewall_blocked_ips` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `incident_report`
--

DROP TABLE IF EXISTS `incident_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
  `resolved_at` datetime(6) DEFAULT NULL,
  `resolution_image_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incident_report`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `incident_report` WRITE;
/*!40000 ALTER TABLE `incident_report` DISABLE KEYS */;
INSERT INTO `incident_report` VALUES
(5462,'Crime','test_resident','HJ88+5WX Famy - Real - Infanta Road, Real, Calabarzon,','Resolved',14.56535797150489,121.61706714218529,'2026-02-16 16:26:26','1771230388287-971120952.jpeg',NULL,'admin_tanod','2026-02-16 16:42:22.000000',NULL),
(5862,'Fire','test_resident','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Under Review',14.3982339,121.4746753,'2026-02-16 17:18:36','1771233517670-370172518.jpeg',NULL,NULL,NULL,NULL),
(7711,'Crime','test_resident','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Under Review',14.3982351,121.4746736,'2026-02-16 16:25:58',NULL,NULL,NULL,NULL,NULL),
(7937,'Fire','test_resident','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Resolved',14.3982339,121.4746739,'2026-02-16 20:27:07','1771244829443-238873532.jpeg',NULL,'Admin','2026-02-16 23:52:55.000000',NULL),
(8076,'Accident','test_resident','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Resolved',14.3982216,121.4746614,'2026-02-16 17:03:30','1771232612580-851373933.jpeg',NULL,'admin_tanod','2026-02-16 17:06:05.000000',NULL),
(9388,'Accident','test_resident','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Resolved',14.3982343,121.4746754,'2026-02-16 17:53:43','1771235624578-115347956.jpeg','admin_tanod','admin_tanod','2026-02-18 17:44:03.000000',NULL);
/*!40000 ALTER TABLE `incident_report` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `incident_types`
--

DROP TABLE IF EXISTS `incident_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `incident_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incident_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `incident_types` WRITE;
/*!40000 ALTER TABLE `incident_types` DISABLE KEYS */;
INSERT INTO `incident_types` VALUES
(1,'Fire','🔥','#ff4444','2026-02-16 04:38:01'),
(2,'Medical Emergency','🚑','#ff6b6b','2026-02-16 04:38:01'),
(3,'Accident','🚗','#ffa500','2026-02-16 04:38:01'),
(4,'Theft','🔒','#9b59b6','2026-02-16 04:38:01'),
(5,'Violence','⚠️','#e74c3c','2026-02-16 04:38:01'),
(6,'Noise Complaint','🔊','#3498db','2026-02-16 04:38:01'),
(7,'Suspicious Activity','👁️','#f39c12','2026-02-16 04:38:01'),
(8,'Other','📋','#95a5a6','2026-02-16 04:38:01');
/*!40000 ALTER TABLE `incident_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `ID` int(255) NOT NULL AUTO_INCREMENT,
  `USER` varchar(255) NOT NULL,
  `TIME` varchar(255) NOT NULL,
  `TIME_IN` varchar(255) DEFAULT NULL,
  `TIME_OUT` varchar(255) DEFAULT NULL,
  `LOCATION` varchar(255) DEFAULT NULL,
  `ACTION` varchar(255) NOT NULL,
  `time_in_photo` varchar(255) DEFAULT NULL,
  `time_out_photo` varchar(255) DEFAULT NULL,
  `time_in_video` varchar(255) DEFAULT NULL,
  `time_out_video` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
INSERT INTO `logs` VALUES
(1,'admin_tanod','2026-02-18 17:20:32','2026-02-18 17:20:32',NULL,NULL,'On Duty','1771406432409-870682131.jpeg',NULL,NULL,NULL);
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `logs_patrol`
--

DROP TABLE IF EXISTS `logs_patrol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs_patrol` (
  `ID` int(255) NOT NULL AUTO_INCREMENT,
  `USER` varchar(255) NOT NULL,
  `TIME` varchar(255) NOT NULL,
  `LOCATION` varchar(255) NOT NULL,
  `ACTION` varchar(255) NOT NULL,
  `incident_id` int(11) DEFAULT NULL,
  `status` varchar(25) DEFAULT 'unread',
  `resolved_by` varchar(255) DEFAULT NULL,
  `resolved_at` varchar(255) DEFAULT NULL,
  `resolution_image_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs_patrol`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `logs_patrol` WRITE;
/*!40000 ALTER TABLE `logs_patrol` DISABLE KEYS */;
INSERT INTO `logs_patrol` VALUES
(1,'admin_tanod','2026-02-16 16:51:52','HJ88+5WX Famy - Real','New Incident Reported',5462,'unread',NULL,NULL,NULL),
(2,'admin_tanod','2026-02-16 17:03:35','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','New Incident Reported by test_resident at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, - Type: Accident',8076,'Resolved','admin_tanod','2026-02-16 17:06:05','resolution-1771232764586-698058442.jpeg'),
(3,'admin_tanod','2026-02-16 17:18:39','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','New Incident Reported by test_resident at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, - Type: Fire',5862,'unread',NULL,NULL,NULL),
(4,'admin_tanod','2026-02-16 17:53:46','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','New Incident Reported by test_resident at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, - Type: Accident',9388,'unread',NULL,NULL,NULL),
(5,'admin_tanod','2026-02-16 20:27:11','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','New Incident Reported at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, - Type: Fire',7937,'unread',NULL,NULL,NULL),
(6,'Admin','2026-02-16 23:52:55','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Resolved Incident: Fire',NULL,'unread',NULL,NULL,NULL),
(7,'admin_tanod','2026-02-18 17:22:02','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Assigned to Incident: Accident',9388,'Resolved','admin_tanod','2026-02-18 17:44:03','resolution-1771407842820-813480064.jpeg');
/*!40000 ALTER TABLE `logs_patrol` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `logs_resident`
--

DROP TABLE IF EXISTS `logs_resident`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs_resident` (
  `ID` int(255) NOT NULL AUTO_INCREMENT,
  `USER` varchar(255) NOT NULL,
  `TIME` varchar(255) NOT NULL,
  `LOCATION` varchar(255) DEFAULT NULL,
  `ACTION` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs_resident`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `logs_resident` WRITE;
/*!40000 ALTER TABLE `logs_resident` DISABLE KEYS */;
INSERT INTO `logs_resident` VALUES
(1,'test_resident','2026-02-16 16:25:59','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Incident reported at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, (Crime). Please avoid the area.'),
(2,'test_resident','2026-02-16 16:26:30','HJ88+5WX Famy - Real - Infanta Road, Real, Calabarzon,','Incident reported at HJ88+5WX Famy - Real - Infanta Road, Real, Calabarzon, (Crime). Please avoid the area.'),
(3,'test_resident','2026-02-16 17:03:35','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Incident reported at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, (Accident). Please avoid the area.'),
(4,'test_resident','2026-02-16 17:18:39','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Incident reported at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, (Fire). Please avoid the area.'),
(5,'test_resident','2026-02-16 17:53:46','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Incident reported at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, (Accident). Please avoid the area.'),
(6,'test_resident','2026-02-16 20:27:11','08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon,','Incident reported at 08 Palacio Highway Ext., Manila East Rd. Brgy. Balian , Pangil, Calabarzon, (Fire). Please avoid the area.');
/*!40000 ALTER TABLE `logs_resident` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `ID` int(255) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `USER` varchar(255) NOT NULL,
  `STATUS` varchar(255) NOT NULL,
  `LOCATION` varchar(255) DEFAULT NULL,
  `DAY` varchar(255) DEFAULT NULL,
  `START_TIME` varchar(20) DEFAULT NULL,
  `END_TIME` varchar(20) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT 'All',
  `TIME` varchar(255) DEFAULT NULL,
  `IMAGE` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_schedules_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES
(1,2,'admin_tanod','On Duty','Pangil','Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday','01:00','23:00','All',NULL,'');
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `tourist_spots`
--

DROP TABLE IF EXISTS `tourist_spots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tourist_spots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `location` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tourist_spots`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `tourist_spots` WRITE;
/*!40000 ALTER TABLE `tourist_spots` DISABLE KEYS */;
/*!40000 ALTER TABLE `tourist_spots` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
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
  `email_verification_code` varchar(10) DEFAULT NULL,
  `email_verification_code_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin','admin','John Doe','address@','Admin','Verified','1748760269580-559878099.jpg','johndoe@gmail.com',NULL,NULL,NULL,NULL),
(2,'admin_tanod','password123','Thesis Admin','Barangay Hall','Tanod','Verified','','your_email@gmail.com',NULL,NULL,NULL,NULL),
(3,'test_resident','password123','Juan Dela Cruz','Street 1, Bgy Hall','Resident','Verified','','resident@example.com',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-02-19  2:38:19
