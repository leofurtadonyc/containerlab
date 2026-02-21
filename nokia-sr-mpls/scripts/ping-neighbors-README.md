# Nokia SR-MPLS Lab Scripts

This directory contains utility scripts for testing and managing the Nokia SR-MPLS lab deployment.

## Available Scripts

### 1. ping-neighbors.sh (Recommended)

A dynamic neighbor discovery and connectivity test script that automatically parses the topology file to discover neighbor relationships and test IPv4/IPv6 connectivity.

**Features:**
- Automatically discovers neighbors from topology file
- Tests both IPv4 and IPv6 connectivity
- Supports filtering by device type (core, edge, specific devices)
- Color-coded output with success/failure indicators
- Comprehensive reporting with statistics

**Usage:**
```bash
# Test all devices
./ping-neighbors.sh

# Test specific device
./ping-neighbors.sh --device PE1

# Test multiple specific devices  
./ping-neighbors.sh --device PE1 --device P2

# Test only core network devices (P and PE routers)
./ping-neighbors.sh --core

# Test only edge devices (CPE routers)
./ping-neighbors.sh --edge

# List all available devices
./ping-neighbors.sh --list

# Show help
./ping-neighbors.sh --help
```

### 2. ping-test-neighbors.sh (Legacy)

A static connectivity test script with hardcoded neighbor relationships. This script includes predefined test cases for common device types.

**Usage:**
```bash
# Test all devices
./ping-test-neighbors.sh

# Quick test on core devices
./ping-test-neighbors.sh --quick

# Test specific device
./ping-test-neighbors.sh --device PE1
```

## Requirements

Before running these scripts, ensure:

1. **Containerlab deployment is running:**
   ```bash
   clab deploy nokia-sr-mpls-lab1-ipaddr.clab.yml
   ```

2. **Docker is accessible and containers are responsive**

3. **Scripts have executable permissions:**
   ```bash
   chmod +x scripts/*.sh
   ```

## How It Works

### Connection Method
The scripts connect to Nokia SR OS devices using Docker exec:
```bash
docker exec -t clab-nokia-sr-mpls-<device-name> sr_cli -c "<command>"
```

### Topology Parsing
The `ping-neighbors.sh` script automatically parses the `not-a-clab-topology.yml` file to discover:
- Device neighbor relationships
- IPv4 and IPv6 addresses for each interface
- Interface types (only tests routed interfaces)

### Test Execution
For each device, the script:
1. Connects to the Nokia SR OS CLI via Docker
2. Executes ping commands to all discovered neighbors
3. Reports success/failure with color-coded output
4. Provides statistics summary

## Example Output

```
[INFO]  Found containerlab deployment
[INFO]  Found topology file: not-a-clab-topology.yml
[INFO]  Starting comprehensive neighbor connectivity test using topology file

==================== Device 1/34 ====================
[INFO]  Testing connectivity for device: CPE-A1
  Found 1 routed neighbor(s):
  → Testing neighbor: PE1
    IPv4 ping to PE1: ✓ SUCCESS
    IPv6 ping to PE1: ✓ SUCCESS

[INFO]  IPv4 Results: 1/1 tests passed (100.0%)
[INFO]  IPv6 Results: 1/1 tests passed (100.0%)
```

## Troubleshooting

### Common Issues

1. **"No containerlab deployment found"**
   - Deploy the lab first: `clab deploy nokia-sr-mpls-lab1-ipaddr.clab.yml`

2. **"Container not found"**
   - Check if containers are running: `docker ps | grep nokia-sr-mpls`

3. **"Topology file not found"**
   - Ensure you're running the script from the scripts directory
   - Verify `not-a-clab-topology.yml` exists in the parent directory

4. **Ping failures**
   - Check if devices have completed their startup process
   - Verify IPv6 addressing is configured correctly
   - Some devices may take time to establish protocols

### Debug Mode

For troubleshooting individual devices, test them one by one:
```bash
./ping-neighbors.sh --device PE1
```

## Contributing

To add support for additional test scenarios:

1. **For static tests:** Edit `ping-test-neighbors.sh` and add device-specific test cases
2. **For dynamic tests:** The `ping-neighbors.sh` script should automatically discover new devices and neighbors from the topology file

## Notes

- Both scripts use `ping count 3 timeout 5` for consistency
- IPv6 addresses ending in `:0` (network addresses) are skipped as they cannot be assigned to interfaces
- The scripts require the Nokia SR OS containers to be fully booted and responsive