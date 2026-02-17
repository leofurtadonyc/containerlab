from netlab.adapters.containerlab import ContainerlabAdapter


def interfaces_present(adapter: ContainerlabAdapter, host: str) -> dict:
    r = adapter.exec(host, "ip -o link show | awk -F': ' '{print $2}'")
    names = [x.strip() for x in r.stdout.splitlines() if x.strip()]
    return {"rc": r.rc, "interfaces": names, "err": r.stderr}


def ping(adapter: ContainerlabAdapter, host: str, target: str, interface: str | None = None) -> dict:
    cmd = f"ping -c 2 -W 1 {target}" if not interface else f"ping -I {interface} -c 2 -W 1 {target}"
    r = adapter.exec(host, cmd)
    return {"rc": r.rc, "out": r.stdout, "err": r.stderr}


def neigh_show(adapter: ContainerlabAdapter, host: str, interface: str) -> dict:
    r = adapter.exec(host, f"ip neigh show dev {interface}")
    return {"rc": r.rc, "out": r.stdout, "err": r.stderr}
