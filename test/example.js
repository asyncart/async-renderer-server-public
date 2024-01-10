// Manual tests for now
import { renderBlueprintEdition } from '../lib/renderBlueprintEdition.js';
import renderArt from '../lib/renderArt.js';
import { RENDERER_AUTH_SECRET, SERVER_BASE } from '../constants/constants.js';

import { getQueryStr } from '../lib/common/utils.js';
import axios from 'axios';



//// EXAMPLE: rendering the default assets for a DBP:
const { dbpId, typeName, layout } = {
  dbpId: '63dd08e2651ff97b1816ab00',
  typeName: 'Type 1',
  layout: {
    layout: {
      layers: [
        {
          title: 'Outside',
          stateTitle: 'Default',
          uri: 'QmapCz6Y9dbKDB6GngRJond8nB4invFAPkGKdP55qnJikL'
        },
        {
          title: 'Room',
          stateTitle: 'Default',
          uri: 'QmcLrZ6bvKAwM5bjnJzi7Jbob62SAGTfrMnw9xHc4uY2FQ'
        },
        {
          title: 'Upper_Wall_(Left)',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Upper_Wall_(Right)',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Wires',
          stateTitle: 'Default',
          uri: 'QmbpWAyG5oCUbGrEkKiLw6PqjVkuCoyoEwb33B6qWUAJa4'
        },
        {
          title: 'Frames_(Hidden)',
          stateTitle: 'Default',
          uri: 'QmQMPbZFRVoL9r7YPj51VzaqjQLvzBtTgt3TpX16E7ssVB'
        },
        {
          title: 'Back_Left_Screen',
          stateTitle: 'Default',
          uri: 'QmPznU3GhjbACz5MqExnH2fAfC9zeVQDmfmBhJFikfMbAD',
          blendMode: 'screen'
        },
        {
          title: 'Back_Right_Screen',
          stateTitle: 'Default',
          uri: 'Qme2uiob671MBvb7kdTdwNu67f6Q93x5UAWzBZ5vKuGCWg',
          blendMode: 'screen'
        },
        {
          title: 'Async_Case_:_6',
          stateTitle: undefined,
          uri: 'QmZuL8eMWrpDSBGaUcZkFTuW1Xfr9NDkxgHbGFWdMZ4Run',
          blendMode: 'screen'
        },
        {
          title: 'Async_Case_:_5',
          stateTitle: 'Default',
          uri: 'QmVhR6qiH82q1xTubSF6fxCPfrohbVCMUSqUnLrEdgTZKG',
          blendMode: 'screen'
        },
        {
          title: 'Async_Case_:_4',
          stateTitle: 'Default',
          uri: 'QmcwmQ6p5CFsTU3qUKUpHYMRVsSCBZ1LqLDPzTYDHskaTq',
          blendMode: 'screen'
        },
        {
          title: 'Async_Case_:_3',
          stateTitle: 'Default',
          uri: 'QmWLT4V2A1zTracJY48NgZeEXxZjzc4fuJzxi6SSS6oSJK',
          blendMode: 'screen'
        },
        {
          title: 'Async_Case_:_2',
          stateTitle: 'Default',
          uri: 'QmZye1BZFMSnc5QCUVwEFe8BaWJ6VwqLXkgeuNkDEbZVL5',
          blendMode: 'screen'
        },
        {
          title: 'Async_Case_:_1',
          stateTitle: 'Default',
          uri: 'QmdiM3aMkzaM3SrbiGzhwskqZTCkUzWnpn3r7eRCECBWcC',
          blendMode: 'screen'
        },
        {
          title: 'NFT_Case_:_6',
          stateTitle: 'Default',
          uri: 'QmcqvpgmvwdDjVD7wm62B69rETs6j2YpBBk1HZukFme5MD',
          blendMode: 'screen'
        },
        {
          title: 'NFT_Case_:_5',
          stateTitle: undefined,
          uri: 'QmUzZenYNJPCKprUoFH2kAk6LHxWmUVjM5sjyftur4Q3a3',
          blendMode: 'screen'
        },
        {
          title: 'NFT_Case_:_4',
          stateTitle: '4',
          uri: 'QmYP3Kt8CZJkaHryMroZ5VktxKEjRDKsWR5EJBhh8CaZDC',
          blendMode: 'screen'
        },
        {
          title: 'NFT_Case_:_3',
          stateTitle: 'Default',
          uri: 'QmQHSaRTLeWwEQeQpbThQE8rKyZbAjR7mF9qRgjM7JWXwd',
          blendMode: 'screen'
        },
        {
          title: 'NFT_Case_:_2',
          stateTitle: 'Default',
          uri: 'QmUxqo2Zf3sNowhHNg9DccWuim3QEgTnLxp4igPRVTyYQF',
          blendMode: 'screen'
        },
        {
          title: 'NFT_Case_:_1',
          stateTitle: 'Default',
          uri: 'QmcnR6A9JWWY3Z3ajWRstb3F2VwN1dDkM6vzR1VsJtBueW',
          blendMode: 'screen'
        },
        {
          title: 'Right_Seat_3',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Left_Seat_3',
          stateTitle: undefined,
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Right_Seat_2',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Left_Seat_2',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Right_Seat_1',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Left_Seat_1',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Center_Seat',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Table',
          stateTitle: 'Default',
          uri: 'QmQ6WbViyf4DAZgxajZwWT9WzHY6MCF3Z7LLHrmqvg2aDL'
        },
        {
          title: 'Table_Top_(R)',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Table_Top_(L)',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Foreground_Object_(R)',
          stateTitle: undefined,
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Foreground_Object_(L)',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Atmosphere',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN'
        },
        {
          title: 'Lighting_(hidden)',
          stateTitle: 'Default',
          uri: 'QmXrFncn5GYbiFLYX1C2YBCbYkgk3vRhNNCerCv2YBHvoN',
          blendMode: 'overlay'
        }
      ]

    }
  }
};
const { imageUrl, standardAudioUrl, hdAudioUrl, mergedMp4Url } =
  await renderBlueprintEdition(layout);

console.log("imageUrl", imageUrl)

// const endpoint = `${SERVER_BASE}dynamicBlueprints/${dbpId}/updateDefaultImage`;
// await axios.patch(
//   endpoint,
//   {
//     typeName,
//     imageUrl,
//     audioUrl: standardAudioUrl,
//     hdAudioUrl,
//     mergedMp4Url
//   },
//   { headers: { Authorization: RENDERER_AUTH_SECRET } }
// );



//// EXAMPLE: rendering Ethboy
// const tokenId = 807
// const blockNum = 16619699
// const txHash = "0x778ec98d0b3ce119ac87fb02d5258754e0873bdfc496276b0f990b684c679446"
// const tokenAddress = "0xb6dae651468e9593e4581705a09c10a76ac1e0c8"
// renderArt(blockNum, tokenId, txHash).then(result => {
//   console.log(result)
//   const imageUrl = result.imageUrl;
//   const audioUrl = result.audioUrl;

//   const imagePath = imageUrl.split('/upload/')[1];
//   const queryStr = getQueryStr({ imagePath, txHash, audioUrl });

//   const endpoint = `${SERVER_BASE}arts/${tokenAddress}-${tokenId}?${queryStr}`;
//   axios.patch(endpoint).then(r => {
//     console.log("DONE")
//   })
// })




// const layout = {
//   layout: {
//     type: 'layered_static',
//     version: 5,
//     layers: [
//       {
//         id: 'One',
//         uri: 'QmZR6EjcTwt7gvRDEh9k91cywWBe82GdBDPZQxKotJPcvK',
//         label: 'sdf'
//       },
//       {
//         id: 'Two',
//         uri: 'QmULV3JwLhCD9Cf33HUzEAmEkRFk6UGoAUFqTTn2i1Gs2X',
//         label: 'gwr',
//         anchor: 'One',
//         color: {
//           lighten: 1
//         }
//       },
//       {
//         id: 'f23',
//         uri: 'QmajrbqgdrjCVtTTc4MFEBFskFUGiUnA2X9eSWWgwXBpF2',
//         label: 'asdf',
//         anchor: 'One',
//         color: {
//           hardlight: 1
//         }
//       }
//     ]
//   }
// };

// const layout = {
//   "layout": {
//     "type": "layered_static",
//     "version": 5,
//     "layers": [
//       {
//         "id": "layer_1",
//         "label": null,
//         "uri": "QmTwCMC8zj1wjSt5VfDhrffQHLxBydNthLDAHs3B54aYvj"
//       },
//       {
//         "id": "Stem (lead)",
//         "label": "Mania",
//         "audioUri": "QmQ1uwMNwsVeoYAL8FFMNkEVBXoLKLAv31x6zUgKa2h299",
//         "anchor": "layer_1"
//       },
//       {
//         "id": "Stem",
//         "label": "Bargaining",
//         "audioUri": "QmYTvob8KW1xwVmVExWMqUBkocFHKKBGT4o1spiHRVXgUX",
//         "anchor": "layer_1"
//       }
//     ],
//     "mastering": {
//       "corrective": [
//         "equalizer=f=220:width_type=q:width=15:g=-0.5",
//         "equalizer=f=365:width_type=q:width=15:g=-1",
//         "equalizer=f=3600:width_type=q:width=4:g=-1.5"
//       ],
//       "broadShaping": [
//         "asubcut=cutoff=35:order=10:level=1",
//         "equalizer=f=45:width_type=q:width=10:g=-0.5",
//         "equalizer=f=65:width_type=q:width=9:g=0.5",
//         "equalizer=f=120:width_type=q:width=10:g=0.5",
//         "equalizer=f=800:width_type=q:width=5:g=0.5",
//         "equalizer=f=1600:width_type=q:width=3:g=1",
//         "treble=gain=1.5:f=5650:width_type=q:width=1:poles=2:mix=1:channels=1:normalize=disabled:transform=svf:precision=auto"
//       ],
//       "compressionThresholdEquation": "return Math.pow(10, ((maxVolume-10)/20));",
//       "compressionEquation": "acompressor=threshold={threshold}:ratio=3:attack=65:release=100:makeup=(-{maxVolume}+2)",
//       "limiter": [
//         "alimiter=level_in=1:level_out=1:limit=1:attack=6:release=50:level=enabled"
//       ]
//     }
//   }
// }

// renderBlueprintEdition(layout);




// https://asynchronous-art-inc-res.cloudinary.com/video/upload/v1655996480/0xd7cc2856e994d992c8c26f9777bb22670ceefb1d/62b47ff20b7ee9c9b06cbcad/layers/62b47ff20b7ee9c9b06cbcb8_/62b47ff20b7ee9c9b06cbcb9_STATE_/audio/stems-drum2_220623-095447_goyjca.wav
// https://asynchronous-art-inc-res.cloudinary.com/video/upload/v1655996993/0xd7cc2856e994d992c8c26f9777bb22670ceefb1d/62b47ff20b7ee9c9b06cbcad/layers/62b47ff20b7ee9c9b06cbcbb_bass/62b47ff20b7ee9c9b06cbcbd_STATE_/audio/stems-bass-2_220623-094334_mwyyie.wav
// https://asynchronous-art-inc-res.cloudinary.com/video/upload/v1655997541/0xd7cc2856e994d992c8c26f9777bb22670ceefb1d/62b47ff20b7ee9c9b06cbcad/layers/62b47ff20b7ee9c9b06cbcbe_lead/62b484600b7ee9c9b06cd097_STATE_/audio/stems-lead3_220623-094836_fnjtlp.wav


// Use this to test all WAV files (should render HD version):
// const layout = {
//     "layout": {
//     "type": "layered_static",
//     "version": 5,
//     "layers": [
//     {
//     "id": "Background Color",
//     "label": "Coral",
//     "uri": "QmWuTWyWnGRTVDu361arwLLJs53GqW1fpB37uYK6hTameP",
//     "audioUri": "QmXPJ9LCPTtXnAvN9A83HRJBop8Rvmbtwybah8kijFSJnK"
//     },
//     {
//     "id": "Background Element",
//     "label": "Indigo Butterflies",
//     "uri": "QmcPzvpEwTDqqhZKrMFFSya6DJXjhpCyuXnGF6ATD3ZTcC",
//     "audioUri": "QmaG9jXDeM97R4rWABQAWL1YUHUnSs6zZKQez1LQ3picLW",
//     "anchor": "Background Color"
//     },
//     {
//     "id": "Figure",
//     "label": null,
//     "uri": "QmXDmyFeumcB95reN6ZcaYdE1c2tk7eQpTP1Z6WoXD4HQ4",
//     "audioUri": "QmWYBzn7v7GXnC3SyyoyE7sf6EjL5PuT9S4B77kFb1kb2L",
//     "anchor": "Background Color"
//     },
//     {
//     "id": "Eyes",
//     "label": "Shut Out the World",
//     "uri": "QmbRLcwirT2VJhsJh76wpnfMAwRkrDqZMqrbVN6Jk9r8nM",
//     "audioUri": "QmaTwsqNctCpWr4JQGJdAwPcX1QSgYfTWsGzzu2Hjsghnr",
//     "anchor": "Background Color"
//     },
//     {
//     "id": "Piano",
//     "label": "Lo-fi",
//     "audioUri": "Qmby5Gbm4mJdT2e3LpZL3noYRJ9QgpLDeH1hVrsmWq9VnP",
//     "anchor": "Background Color"
//     },
//     {
//     "id": "Strings",
//     "label": "None",
//     "audioUri": "QmaG9jXDeM97R4rWABQAWL1YUHUnSs6zZKQez1LQ3picLW",
//     "anchor": "Background Color"
//     },
//     {
//     "id": "High Keys",
//     "label": "Bubbly",
//     "audioUri": "QmXtmkhZnsiDv6pmZYYXGGRGxBPM7JC8LochvJgaWZ1K2k",
//     "anchor": "Background Color"
//     }
//     ],
//     "mastering": {
//     "corrective": [],
//     "broadShaping": [],
//     "compressionThresholdEquation": null,
//     "compressionEquation": null,
//     "limiter": [
//     "alimiter=level_in=1:level_out=1:limit=1:attack=6:release=50:level=enabled"
//     ]
//     }
//     }
// }





/*
    Oddiovizion
    The piece: https://api.async-api.com/admin/blueprints/62bdc2991506b1256c95c0a6
    ArtBuilder: https://api.async-api.com/asyncCanvas/62b47ff20b7ee9c9b06cbcad/adminReview

*/


// // This is the Oddiovision one (rendering all white)
// const layout = {
//     layout: {
//       type: 'layered_static',
//       version: 5,
//       layers: [
//         {
//           id: 'drums',
//           label: 'saturday morning dead',
//           audioUri: 'QmQZGuxiZstpb6cpn7xcFBFJMDCwSwjBam4iu61cjw3br8',
//           uri: 'QmZSiP3ufVi5H2TzmUTwYCWX2B8LiAGJ6qeQGU9SHzYk2n'
//     },
//         {
//           id: 'bass',
//           label: 'grid loser',
//           audioUri: 'QmY3qsqYURHL2dSHCGncypGKKMwVdEk6K8CB7vrW7NDe5Y',
//           anchor: 'drums'
//         },
//         {
//           id: 'lead',
//           label: 'binary cathedral',
//           audioUri: 'QmagHJobJZf2ESHLgJuLL48LCrT2TytaF2jfv9A713ZZzG',
//           anchor: 'drums'
//         },
//         // {
//         //   id: 'WHITE',
//         //   label: null,
//         //   uri: 'QmZSiP3ufVi5H2TzmUTwYCWX2B8LiAGJ6qeQGU9SHzYk2n',
//         //   anchor: 'drums'
//         // },
//         {
//           id: 'YELLOW',
//           label: 'hexagon',
//           uri: 'QmTcdvkBbeLx6NVnyKZAVfuiekPAjP7Kf2pA8vTFgKi1rH',
//           anchor: 'drums',
//           color: { multiply: 1 }
//         },
//         {
//           id: 'CYAN',
//           label: 'diamond',
//           uri: 'QmbmyuPqNfyvuMUexSSneaKidGPv1MkCLUVqxSvvkPGXeR',
//           anchor: 'drums',
//           color: { multiply: 1 }
//         },
//         {
//           id: 'MAGENTA',
//           label: 'square',
//           uri: 'QmfEMGCXiCdErELSfQ4HbttFXsEu7na4eUFWPFpu3kYdj2',
//           anchor: 'drums',
//           color: { multiply: 1 }
//         },
//         {
//           id: 'corners',
//           label: '01',
//           uri: 'QmR1pdNJ4Lo74cpULKCcN5tcBR3x7WLGpeD5qMSGdgn4EY',
//           anchor: 'drums',
//           color: { multiply: 1 }
//         },
//         {
//           id: 'distressed',
//           label: '18',
//           uri: 'QmZscmrRJkwuWNiQtk42UqgfYx4qUW9ApDAnpK5eFAvw9N',
//           anchor: 'drums',
//           color: { screen: 1 }
//         },
//         {
//           id: 'iris',
//           label: '35',
//           uri: 'Qmf5yi344P7STHjjqLse1zWxz8ydGvMUstikrwzHZnt4BR',
//           anchor: 'drums'
//         }
//       ],
//       mastering: {
//         corrective: [],
//         broadShaping: [
//           'asubcut=cutoff=20:order=10:level=1',
//           'equalizer=f=45:width_type=q:width=8.5:g=0.4',
//           'equalizer=f=1600:width_type=q:width=2:g=0.5',
//           'treble=gain=1:f=24000:width_type=q:width=1:poles=2:mix=1:channels=1:normalize=disabled:transform=svf:precision=auto'
//         ],
//         compressionThresholdEquation: 'return Math.pow(10, ((maxVolume-4)/20));',
//         compressionEquation:
//           'acompressor=threshold={threshold}:ratio=2:attack=50:release=115:makeup=(-{maxVolume}+2)',
//         limiter: [
//           'alimiter=level_in=1:level_out=1:limit=1:attack=6:release=50:level=enabled'
//         ]
//       }
//     }
//   };


// renderBlueprintEdition(layout);





// audioUrls = [
//   'https://asynchronous-art-inc-res.cloudinary.com/video/upload/v1655140451/0x4015b16c6050d2509d94d7eddfba461ac8403272/62a76665fe524f083739de9f/layers/62a7702cd2d173897b1c7f19_to-ithaca/62a7702cd2d173897b1c7f1a_STATE_to-ithaca/audio/To_Ithaca_dtkoxn.mp3'
// ];

// const masteringObject = {
//   corrective: [],
//   broadShaping: [
//     'asubcut=cutoff=20:order=10:level=1',
//     'equalizer=f=45:width_type=q:width=8.5:g=0.4',
//     'equalizer=f=1600:width_type=q:width=2:g=0.5',
//     'treble=gain=1:f=24000:width_type=q:width=1:poles=2:mix=1:channels=1:normalize=disabled:transform=svf:precision=auto'
//   ],
//   compressionThresholdEquation: 'return Math.pow(10, ((maxVolume-4)/20));',
//   compressionEquation:
//     'acompressor=threshold={threshold}:ratio=2:attack=50:release=115:makeup=(-{maxVolume}+2)',
//   limiter: [
//     'alimiter=level_in=1:level_out=1:limit=1:attack=6:release=50:level=enabled'
//   ]
// };

// renderAudioClip({ audioUrls, masteringObject, timeStart: 5.5, timeEnd: 35.5 });
