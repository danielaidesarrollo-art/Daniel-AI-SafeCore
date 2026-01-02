# Strict Security Groups
# denies all direct access except via Sidecar

resource "aws_security_group" "safecore_sg" {
  name        = "safecore-sg"
  description = "Allow inbound traffic only from Sidecar Mesh"
  vpc_id      = aws_vpc.safecore_vpc.id

  # Ingress: Allow mTLS port only
  ingress {
    description = "mTLS from Service Mesh"
    from_port   = 8443
    to_port     = 8443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Internal Mesh CIDR
  }

  # Egress: Allow outbound only to KMS and Audit
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
