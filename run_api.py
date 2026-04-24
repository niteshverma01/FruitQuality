import argparse
import os


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Fruit Quality Flask API.")
    parser.add_argument("--host", default=os.environ.get("HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "5000")))
    parser.add_argument("--debug", action="store_true", default=os.environ.get("FLASK_DEBUG", "0") == "1")
    args = parser.parse_args()

    os.environ["HOST"] = str(args.host)
    os.environ["PORT"] = str(args.port)
    os.environ["FLASK_DEBUG"] = "1" if args.debug else os.environ.get("FLASK_DEBUG", "0")

    import app

    app.app.run(host=args.host, port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()

