{
  description = "AGS-based shell in default libadwaita style";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:aylur/ags/7d6493656c160bedde29716e3eb391180ad538b1";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ags,
  }: let
    pname = "adw-shell";
    entry = "app.ts";

    supportedSystems = ["x86_64-linux" "aarch64-linux"];
    forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    pkgsFor = system: nixpkgs.legacyPackages.${system};

    mkExtraPackagesFor = system: let
      pkgs = pkgsFor system;

      astalPackages = with ags.packages.${system}; [
        apps
        astal4
        battery
        bluetooth
        hyprland
        io
        mpris
        network
        notifd
        tray
        wireplumber
      ];
    in
      astalPackages
      ++ [
        pkgs.libadwaita
        pkgs.libsoup_3
      ];

    mkPackagesFor = system: let
      pkgs = pkgsFor system;
      extraPackages = mkExtraPackagesFor system;
    in {
      default = pkgs.stdenv.mkDerivation {
        name = pname;
        src = ./.;

        nativeBuildInputs = with pkgs; [
          wrapGAppsHook4
          gobject-introspection
          ags.packages.${system}.default
          makeWrapper
        ];

        buildInputs = extraPackages ++ [pkgs.gjs];

        installPhase = ''
          runHook preInstall

          mkdir -p $out/bin
          mkdir -p $out/share
          cp -r * $out/share
          ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

          wrapProgram $out/bin/${pname} \
            --prefix PATH : ${pkgs.lib.makeBinPath (with pkgs; [
            # Runtime dependencies.
            dart-sass
          ])}

          runHook postInstall
        '';
      };

      ags = ags.packages.${system}.default;
    };

    mkDevShellFor = system: let
      pkgs = pkgsFor system;
      agsPackage = ags.packages.${system}.default.override {
        inherit extraPackages;
      };
      extraPackages = mkExtraPackagesFor system;
    in {
      default = pkgs.mkShell {
        buildInputs = [
          agsPackage
          pkgs.biome
          pkgs.dart-sass
          pkgs.nodejs
          pkgs.typescript
        ];

        shellHook = ''
          mkdir -p node_modules
          rm -f node_modules/ags
          ln -sf ${agsPackage}/share/ags/js node_modules/ags
        '';
      };
    };
  in {
    packages = forAllSystems mkPackagesFor;
    devShells = forAllSystems mkDevShellFor;
  };
}
