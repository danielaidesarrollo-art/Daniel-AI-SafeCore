# Daniel_AI SafeCore VPC Template
# Enforces Private Network Isolation

provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "safecore_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "daniel-ai-safecore-vpc"
    Purpose = "Clinical Data Isolation"
  }
}

resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.safecore_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "safecore-private-subnet"
    Type = "Private"
  }
}
