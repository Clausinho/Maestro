{
  description = "Maestro - AI agent orchestrator development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Python with setuptools for node-gyp
        pythonEnv = pkgs.python3.withPackages (ps: with ps; [
          setuptools
        ]);
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and package managers
            nodejs_22
            pnpm
            
            # Python with setuptools for native module builds
            pythonEnv
            
            # Build tools for native modules
            pkg-config
            gnumake
            gcc
            
            # Electron dependencies
            electron_28
            
            # better-sqlite3 dependencies
            sqlite
            
            # node-pty dependencies  
            libsecret
            
            # Git
            git
          ];

          shellHook = ''
            echo "Maestro development environment"
            echo "Node: $(node --version)"
            echo "Python: $(python3 --version)"
            echo "pnpm: $(pnpm --version)"
            echo ""
            echo "To rebuild native modules, run:"
            echo "  pnpm rebuild"
            echo ""
            echo "To start development:"
            echo "  pnpm run dev"
          '';
        };
      }
    );
}
