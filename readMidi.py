import midi
import sys
from collections import defaultdict

def getData(midi_file_path):
    tracks = midi.read_midifile(midi_file_path)
    ranges = [[] for _ in range(len(tracks))]

    for evt in tracks[0]:
        if isinstance(evt, midi.SetTempoEvent):
            deltaSec = 60 / (evt.bpm * tracks.resolution) # seconds per tick
            break
    for i, track in enumerate(tracks):
        time = 0.0
        pitches = defaultdict(list)
        for evt in track:
            time += evt.tick * deltaSec
            if not isinstance(evt, midi.NoteOnEvent): continue
            if isinstance(evt, midi.NoteOffEvent) or evt.velocity == 0:
                pitches[evt.pitch][-1][1] = time # end
            else:
                pitches[evt.pitch].append([time, -1]) # start
        ranges[i] = sorted(list({tuple(arr) for vals in pitches.values() for arr in vals})) # remove duplicated keys
    return ranges



path = 'DJ Yoshitaka - FLOWER.mid' if len(sys.argv) < 2 else sys.argv[1]

try:
    data = getData(path)
except:
    print(f"Can't read file {path}.")
    exit()

try:
    with open('midi.txt', 'w') as f:
        f.write(str([[list(tup) for tup in arr] for arr in data]))
except:
    print("Can't write to midi.txt.")
