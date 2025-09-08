# API Routes Summary

## Main Ayah Text Routes (English/Asad Translation)

### `/api/ayah-text`
- **Purpose**: Fetch English/Asad translation for single ayahs
- **Input**: `globalAyah` (global ayah number)
- **Output**: English/Asad translation text
- **Fallback Chain**: Asad → English → Arabic
- **Used by**: Main ayah display in response

### `/api/ayah-range`
- **Purpose**: Fetch English/Asad translation for ayah ranges
- **Input**: `surah`, `startAyah`, `endAyah`
- **Output**: Combined English/Asad translation text
- **Fallback Chain**: Asad → English → Arabic
- **Used by**: Range ayah display in response

## Arabic Text Routes (Language Toggle)

### `/api/arabic-ayah`
- **Purpose**: Fetch Arabic text for single ayahs (language toggle)
- **Input**: `globalAyah` (global ayah number)
- **Output**: Arabic text only
- **Used by**: Language toggle button (English ↔ Arabic)

### `/api/arabic-range`
- **Purpose**: Fetch Arabic text for ayah ranges (language toggle)
- **Input**: `surah`, `startAyah`, `endAyah`
- **Output**: Combined Arabic text
- **Used by**: Language toggle button for ranges (English ↔ Arabic)

## Summary

- **Main display**: Uses `ayah-text` and `ayah-range` for English/Asad translations
- **Language toggle**: Uses `arabic-ayah` and `arabic-range` for Arabic text
- **No conflicts**: Each route serves a specific purpose
- **Consistent API**: All routes follow the same parameter patterns
