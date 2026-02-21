#!/bin/bash

# Nokia SR-MPLS Lab - Dynamic Neighbor Discovery and Ping Test
# This script parses the topology file to discover neighbors and test connectivity

set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
CONTAINER_PREFIX="clab-nokia-sr-mpls"
TOPOLOGY_FILE="not-a-clab-topology.yml"
PING_COUNT=3
PING_TIMEOUT=5
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(dirname "$SCRIPT_DIR")"

# Function to log messages
log() {
    local level=$1
    shift
    case $level in
        INFO)  echo -e "${BLUE}[INFO]${NC}  $*" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC}  $*" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $*" ;;
        SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} $*" ;;
    esac
}

# Function to check if containerlab deployment exists
check_deployment() {
    if ! docker ps --filter "name=${CONTAINER_PREFIX}" --format "table {{.Names}}" | grep -q "${CONTAINER_PREFIX}"; then
        log ERROR "No containerlab deployment found. Please deploy the lab first with:"
        echo "  clab deploy nokia-sr-mpls-lab1-ipaddr.clab.yml"
        exit 1
    fi
    log SUCCESS "Found containerlab deployment"
}

# Function to check if topology file exists
check_topology_file() {
    if [[ ! -f "$LAB_DIR/$TOPOLOGY_FILE" ]]; then
        log ERROR "Topology file not found: $LAB_DIR/$TOPOLOGY_FILE"
        exit 1
    fi
    log SUCCESS "Found topology file: $LAB_DIR/$TOPOLOGY_FILE"
}

# Function to execute command on a device
exec_on_device() {
    local device=$1
    local command=$2
    local container_name="${CONTAINER_PREFIX}-${device}"
    
    # Try containerlab exec first, then fall back to docker exec
    if command -v clab >/dev/null 2>&1; then
        if clab exec --label "clab-node-name=$device" --cmd "$command" 2>/dev/null; then
            return 0
        fi
    fi
    
    # Fallback: try SSH to container
    local container_ip
    container_ip=$(docker inspect "${container_name}" | grep '"IPAddress"' | tail -1 | cut -d'"' -f4)
    if [[ -n "$container_ip" ]] && command -v sshpass >/dev/null 2>&1; then
        if sshpass -p 'admin' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 admin@"$container_ip" "$command" 2>/dev/null; then
            return 0
        fi
    fi
    
    # Last resort: docker exec
    if docker exec "$container_name" "$command" 2>/dev/null; then
        return 0
    fi
    
    return 1
}

# Function to ping IPv4 address
ping_ipv4() {
    local device=$1
    local target_ip=$2
    local neighbor_name=$3
    
    echo -n "    IPv4 ping to $neighbor_name ($target_ip): "
    
    if exec_on_device "$device" "ping $target_ip count $PING_COUNT" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ SUCCESS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to ping IPv6 address
ping_ipv6() {
    local device=$1
    local target_ip=$2
    local neighbor_name=$3
    
    echo -n "    IPv6 ping to $neighbor_name ($target_ip): "
    
    if exec_on_device "$device" "ping $target_ip count $PING_COUNT" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ SUCCESS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to parse topology and extract neighbor information
parse_topology() {
    local device=$1
    local topology_file="$LAB_DIR/$TOPOLOGY_FILE"
    
    # Debug: check if file exists and is readable
    if [[ ! -f "$topology_file" ]]; then
        log ERROR "Topology file not found: $topology_file" >&2
        return 1
    fi
    
    # Extract just the section for our device and parse systematically
    local python_output
    python_output=$(python3 -c "
import yaml
import sys

try:
    with open('$topology_file', 'r') as f:
        data = yaml.safe_load(f)
    
    # Find the device in the topology - handle different structures
    device_data = None
    
    # Check if it's a list at root level
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                # Check if this item has devices
                if 'devices' in item:
                    for device in item['devices']:
                        if device.get('name') == '$device':
                            device_data = device
                            break
                # Check if this is a device directly
                elif item.get('name') == '$device':
                    device_data = item
                    break
            if device_data:
                break
    
    # Check if it's a dict with devices key
    elif isinstance(data, dict):
        if 'devices' in data:
            for device in data['devices']:
                if device.get('name') == '$device':
                    device_data = device
                    break
        elif 'topology' in data and 'nodes' in data['topology']:
            for node in data['topology']['nodes']:
                if node.get('name') == '$device':
                    device_data = node
                    break
    
    if not device_data or 'interfaces' not in device_data:
        sys.exit(0)  # No interfaces found
    
    # Extract routed interfaces with neighbors
    for interface in device_data['interfaces']:
        if (interface.get('type') == 'routed' and 
            'neighbor' in interface and 
            interface['neighbor'] != 'Stub_interface'):
            
            neighbor = interface['neighbor']
            if '_' in neighbor:
                neighbor = neighbor.split('_')[0]  # Remove port info
                
            # Get the interface IP and calculate neighbor IP
            ipv4_cidr = interface.get('ipv4', '')
            ipv6_cidr = interface.get('ipv6', '')
            
            ipv4_neighbor = ''
            ipv6_neighbor = ''
            
            # Calculate IPv4 neighbor address for /30 subnets
            if ipv4_cidr and '/' in ipv4_cidr:
                import ipaddress
                try:
                    net = ipaddress.IPv4Network(ipv4_cidr, strict=False)
                    if net.prefixlen == 30:
                        # For /30, find the other host IP
                        host_ips = list(net.hosts())
                        current_ip = ipaddress.IPv4Address(ipv4_cidr.split('/')[0])
                        for ip in host_ips:
                            if ip != current_ip:
                                ipv4_neighbor = str(ip)
                                break
                except:
                    pass
            
            # Calculate IPv6 neighbor address for /126 subnets  
            if ipv6_cidr and '/' in ipv6_cidr:
                try:
                    net = ipaddress.IPv6Network(ipv6_cidr, strict=False)
                    if net.prefixlen == 126:
                        # For /126, find the other host IP
                        host_ips = list(net.hosts())
                        current_ip = ipaddress.IPv6Address(ipv6_cidr.split('/')[0])
                        for ip in host_ips:
                            if ip != current_ip:
                                ipv6_neighbor = str(ip)
                                break
                except:
                    pass
            
            if ipv4_neighbor or ipv6_neighbor:
                print(f'{neighbor}|{ipv4_neighbor}|{ipv6_neighbor}')

except Exception as e:
    # Debug: uncomment to see parsing errors
    print(f'Python parsing error: {e}', file=sys.stderr)
    sys.exit(1)
" 2>/dev/null)
    
    local python_exit_code=$?
    
    if [[ $python_exit_code -ne 0 ]]; then
        return 1
    fi
    
    if [[ -n "$python_output" ]]; then
        echo "$python_output"
        return 0
    fi
    
    # If Python parsing didn't work, fall back to AWK parsing
    awk -v target_device="$device" '
        /^  - name: / {
            gsub(/^.*"/, "");
            gsub(/".*$/, "");
            current_device = $0;
            in_target = (current_device == target_device);
            in_interfaces = 0;
            next;
        }
        
        in_target && /^    interfaces:/ {
            in_interfaces = 1;
            next;
        }
        
        in_target && in_interfaces && /^      - intf:/ {
            # Reset variables for new interface
            neighbor = "";
            type = "";
            ipv4 = "";
            ipv6 = "";
            
            # Read interface block
            while (in_target && in_interfaces) {
                if (/^      - intf:/ && NR > interface_start) break;
                interface_start = NR;
                
                if (getline <= 0) break;
                if (/^  - name:/ || (/^    [a-zA-Z]/ && !/^        /)) break;
                
                if (/neighbor:/) {
                    gsub(/^.*"/, "");
                    gsub(/".*$/, "");
                    neighbor = $0;
                    gsub(/_.*$/, "", neighbor);
                } else if (/type:/) {
                    gsub(/^.*"/, "");
                    gsub(/".*$/, "");
                    type = $0;
                } else if (/ipv4:/) {
                    gsub(/^.*"/, "");
                    gsub(/\/.*$/, "");
                    gsub(/".*$/, "");
                    ipv4 = $0;
                } else if (/ipv6:/) {
                    gsub(/^.*"/, "");
                    gsub(/\/.*$/, "");  
                    gsub(/".*$/, "");
                    ipv6 = $0;
                }
                
                if (getline <= 0) break;
                if (/^      - intf:/) {
                    # Process current interface and continue with next
                    if (type == "routed" && neighbor != "" && neighbor != "Stub_interface" && (ipv4 != "" || ipv6 != "")) {
                        print neighbor "|" ipv4 "|" ipv6;
                    }
                    neighbor = "";
                    type = "";
                    ipv4 = "";
                    ipv6 = "";
                    interface_start = NR;
                    continue;
                }
            }
            
            # Process final interface
            if (type == "routed" && neighbor != "" && neighbor != "Stub_interface" && (ipv4 != "" || ipv6 != "")) {
                print neighbor "|" ipv4 "|" ipv6;
            }
        }
        
        in_target && /^  - name:/ && current_device != target_device {
            in_target = 0;
        }
        ' "$topology_file"
}

# Function to test device connectivity using topology parsing
test_device_connectivity() {
    local device=$1
    log INFO "Testing connectivity for device: $device"
    
    # Check if container exists
    local container_name="${CONTAINER_PREFIX}-${device}"
    if ! docker ps --filter "name=${container_name}" --format "{{.Names}}" | grep -q "${container_name}"; then
        log WARN "Container $container_name not found"
        return 1
    fi
    
    # Parse neighbors from topology
    local neighbors
    mapfile -t neighbors < <(parse_topology "$device")
    
    if [[ ${#neighbors[@]} -eq 0 ]]; then
        log WARN "No routed neighbors found for device $device in topology file"
        return 0
    fi
    
    local ipv4_tests=0
    local ipv4_success=0
    local ipv6_tests=0
    local ipv6_success=0
    
    echo "  Found ${#neighbors[@]} routed neighbor(s):"
    
    for neighbor_info in "${neighbors[@]}"; do
        if [[ -z "$neighbor_info" ]]; then
            continue
        fi
        
        IFS='|' read -r neighbor_name ipv4_addr ipv6_addr <<< "$neighbor_info"
        
        # Debug output in verbose mode
        if [[ "${VERBOSE:-0}" == "1" ]]; then
            log DEBUG "Processing neighbor: $neighbor_name (IPv4: $ipv4_addr, IPv6: $ipv6_addr)"
        fi
        
        echo "  → Testing neighbor: $neighbor_name"
        
        # Test IPv4 if address exists and is valid
        if [[ -n "$ipv4_addr" && "$ipv4_addr" != "ipv4" && "$ipv4_addr" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            ping_ipv4 "$device" "$ipv4_addr" "$neighbor_name" && ((ipv4_success++)) || true
            ((ipv4_tests++))
        fi
        
        # Test IPv6 if address exists and is valid  
        if [[ -n "$ipv6_addr" && "$ipv6_addr" != "ipv6" && "$ipv6_addr" =~ ^[0-9a-fA-F:]+$ ]]; then
            ping_ipv6 "$device" "$ipv6_addr" "$neighbor_name" && ((ipv6_success++)) || true
            ((ipv6_tests++))
        fi
        
        # Continue processing loop
        if [[ "${VERBOSE:-0}" == "1" ]]; then
            log DEBUG "Completed testing neighbor: $neighbor_name"
        fi
        
        echo
    done
    
    # Summary for this device
    if [[ $ipv4_tests -gt 0 ]]; then
        local ipv4_percent
        ipv4_percent=$(awk "BEGIN {printf \"%.1f\", $ipv4_success*100/$ipv4_tests}" 2>/dev/null || echo "0.0")
        log INFO "  IPv4 Results: $ipv4_success/$ipv4_tests tests passed (${ipv4_percent}%)"
    else
        log INFO "  IPv4 Results: No IPv4 neighbors found"
    fi
    
    if [[ $ipv6_tests -gt 0 ]]; then
        local ipv6_percent
        ipv6_percent=$(awk "BEGIN {printf \"%.1f\", $ipv6_success*100/$ipv6_tests}" 2>/dev/null || echo "0.0")
        log INFO "  IPv6 Results: $ipv6_success/$ipv6_tests tests passed (${ipv6_percent}%)"
    else
        log INFO "  IPv6 Results: No IPv6 neighbors found"
    fi
    
    return 0
}

# Function to get list of devices from deployment
get_devices() {
    docker ps --filter "name=${CONTAINER_PREFIX}" --format "{{.Names}}" | sed "s/${CONTAINER_PREFIX}-//" | sort
}

# Function to run comprehensive connectivity test
run_connectivity_test() {
    log INFO "Starting comprehensive neighbor connectivity test using topology file"
    echo
    
    local devices
    mapfile -t devices < <(get_devices)
    
    local total_devices=${#devices[@]}
    local current=0
    local successful_devices=0
    
    for device in "${devices[@]}"; do
        ((current++))
        echo "==================== Device $current/$total_devices ===================="
        if test_device_connectivity "$device"; then
            ((successful_devices++))
        fi
        echo
    done
    
    log INFO "Tested $successful_devices/$total_devices devices successfully"
}

# Function to run connectivity test on specific devices
run_device_test() {
    local device_list=("$@")
    
    for device in "${device_list[@]}"; do
        local container_name="${CONTAINER_PREFIX}-${device}"
        if ! docker ps --filter "name=${container_name}" --format "{{.Names}}" | grep -q "${container_name}"; then
            log WARN "Device $device not found in deployment"
            continue
        fi
        
        echo "========== Testing $device =========="
        test_device_connectivity "$device"
        echo
    done
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Nokia SR-MPLS Lab Dynamic Neighbor Ping Test Script

This script automatically discovers neighbors from the topology file and tests IPv4/IPv6 connectivity.

OPTIONS:
    -a, --all                    Test all devices in the deployment (default)
    -d, --device DEVICE          Test specific device only
    -l, --list                   List all devices in the deployment
    -c, --core                   Test core network devices (P and PE routers)
    -e, --edge                   Test edge devices (CPE routers)
    -v, --verbose                Enable verbose output
    -h, --help                   Show this help message

EXAMPLES:
    $0                          # Test all devices
    $0 --device PE1             # Test only PE1 device  
    $0 --device PE1 --device P2 # Test multiple specific devices
    $0 --core                   # Test P and PE routers only
    $0 --list                   # List all available devices

TOPOLOGY FILE:
    The script automatically parses: $TOPOLOGY_FILE
    
REQUIREMENTS:
    - Containerlab deployment must be running
    - Docker must be accessible
    - Topology file must be in the parent directory
    - Nokia SR OS containers must be responsive

EOF
}

# Main function
main() {
    local test_mode="all"
    local specific_devices=()
    local verbose=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--all)
                test_mode="all"
                shift
                ;;
            -d|--device)
                test_mode="specific"
                specific_devices+=("$2")
                shift 2
                ;;
            -l|--list)
                test_mode="list"
                shift
                ;;
            -c|--core)
                test_mode="core"
                shift
                ;;
            -e|--edge)
                test_mode="edge"
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log ERROR "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    check_deployment
    check_topology_file
    
    # Run appropriate test
    case $test_mode in
        all)
            run_connectivity_test
            ;;
        specific)
            if [[ ${#specific_devices[@]} -gt 0 ]]; then
                run_device_test "${specific_devices[@]}"
            else
                log ERROR "No devices specified"
                exit 1
            fi
            ;;
        list)
            log INFO "Available devices in deployment:"
            get_devices | while read -r device; do
                echo "  - $device"
            done
            ;;
        core)
            log INFO "Testing core network devices (P and PE routers)"
            local core_devices
            mapfile -t core_devices < <(get_devices | grep -E '^(P[0-9]+|PE[0-9]+)$' || true)
            if [[ ${#core_devices[@]} -gt 0 ]]; then
                run_device_test "${core_devices[@]}"
            else
                log WARN "No core devices found"
            fi
            ;;
        edge)
            log INFO "Testing edge devices (CPE routers)"
            local edge_devices
            mapfile -t edge_devices < <(get_devices | grep -E '^CPE-' || true)
            if [[ ${#edge_devices[@]} -gt 0 ]]; then
                run_device_test "${edge_devices[@]}"
            else
                log WARN "No edge devices found"
            fi
            ;;
    esac
    
    log SUCCESS "Connectivity testing completed"
}

# Check if script is being sourced or run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi