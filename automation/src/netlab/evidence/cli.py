from netlab.adapters.containerlab import ContainerlabAdapter


class CliTransport:
    def __init__(self, adapter: ContainerlabAdapter) -> None:
        self.adapter = adapter

    def eos(self, node: str, command: str):
        return self.adapter.eos_cli(node, command)

    def linux(self, node: str, command: str):
        return self.adapter.exec(node, command)
