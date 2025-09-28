import httpx
from datetime import datetime, timezone

http_client = httpx.AsyncClient(timeout=25)

def _coin_id(symbol: str) -> str:
    return f"coin:{symbol}"

async def get_current_price(symbol: str) -> float:
    url = f"https://coins.llama.fi/prices/current/{_coin_id(symbol)}"
    r = await http_client.get(url)
    r.raise_for_status()
    return float(r.json()["coins"][_coin_id(symbol)]["price"])

async def get_historical_prices(symbol: str, hours: int = 24):
    start = int(datetime.now(timezone.utc).timestamp()) - hours * 3600
    url = f"https://coins.llama.fi/chart/{_coin_id(symbol)}?start={start}"
    r = await http_client.get(url)
    r.raise_for_status()
    return r.json().get("coins", {}).get(_coin_id(symbol), {}).get("prices", [])