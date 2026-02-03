import torch
import json
from pathlib import Path

MODEL_DIR = Path("models/improved_model_20260128_052645")
MODEL_PATH = MODEL_DIR / "improved_model_best.pth"
CONFIG_PATH = MODEL_DIR / "config.json"
MODEL_INFO_PATH = MODEL_DIR / "model_info.json"

print("="*80)
print("🔍 CHECKING MODEL ARCHITECTURE")
print("="*80)

# 1. Load config.json
print("\n📋 CONFIG.JSON:")
with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)
    print(json.dumps(config, indent=2))

# 2. Load model_info.json
print("\n📋 MODEL_INFO.JSON:")
with open(MODEL_INFO_PATH, 'r') as f:
    model_info = json.load(f)
    print(json.dumps(model_info, indent=2))

# 3. Load and inspect checkpoint
print("\n📦 CHECKPOINT STRUCTURE:")
checkpoint = torch.load(MODEL_PATH, map_location='cpu')

print(f"Type: {type(checkpoint)}")
if isinstance(checkpoint, dict):
    print("\nCheckpoint keys:")
    for key in checkpoint.keys():
        print(f"  - {key}")
    
    if 'model_state_dict' in checkpoint:
        state_dict = checkpoint['model_state_dict']
        print(f"\n✅ Found 'model_state_dict' key")
    else:
        state_dict = checkpoint
        print(f"\n⚠️  No 'model_state_dict' key, using checkpoint directly")
else:
    state_dict = checkpoint
    print("⚠️  Checkpoint is not a dict, using directly")

# 4. Analyze layer structure
print("\n🏗️  MODEL LAYER STRUCTURE:")
print(f"Total parameters: {len(state_dict.keys())}")

# Group layers by prefix
layer_groups = {}
for key in state_dict.keys():
    prefix = key.split('.')[0]
    if prefix not in layer_groups:
        layer_groups[prefix] = []
    layer_groups[prefix].append(key)

print("\nLayer groups:")
for prefix, layers in sorted(layer_groups.items()):
    print(f"\n  {prefix}: ({len(layers)} layers)")
    # Show first 3 layers of each group
    for layer in layers[:3]:
        shape = state_dict[layer].shape
        print(f"    - {layer}: {shape}")
    if len(layers) > 3:
        print(f"    ... and {len(layers) - 3} more")

# 5. Check classifier structure
print("\n🎯 CLASSIFIER STRUCTURE:")
classifier_keys = [k for k in state_dict.keys() if 'fc' in k or 'classifier' in k]
print(f"Found {len(classifier_keys)} classifier layers:")
for key in classifier_keys:
    shape = state_dict[key].shape
    print(f"  - {key}: {shape}")

# 6. Determine architecture
print("\n✅ DETECTED ARCHITECTURE:")
if 'fc.weight' in state_dict and 'fc.bias' in state_dict:
    print("  Type: Simple FC layer")
    fc_in = state_dict['fc.weight'].shape[1]
    fc_out = state_dict['fc.weight'].shape[0]
    print(f"  Input features: {fc_in}")
    print(f"  Output features: {fc_out}")
elif any('classifier' in k for k in state_dict.keys()):
    print("  Type: Complex classifier module")
    classifier_layers = [k for k in state_dict.keys() if 'classifier' in k]
    print(f"  Layers: {len(classifier_layers)}")
else:
    print("  ⚠️  Unknown classifier structure")

# 7. Check LSTM structure
print("\n🔄 LSTM STRUCTURE:")
lstm_keys = [k for k in state_dict.keys() if 'lstm' in k]
print(f"Found {len(lstm_keys)} LSTM layers:")
for key in lstm_keys[:5]:  # Show first 5
    shape = state_dict[key].shape
    print(f"  - {key}: {shape}")

# 8. Check feature extractor
print("\n🎨 FEATURE EXTRACTOR:")
feature_keys = [k for k in state_dict.keys() if 'feature_extractor' in k]
print(f"Found {len(feature_keys)} feature extractor layers")
if feature_keys:
    print("First layer:")
    first_key = feature_keys[0]
    print(f"  - {first_key}: {state_dict[first_key].shape}")

print("\n" + "="*80)